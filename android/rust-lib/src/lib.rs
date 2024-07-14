use std::error::Error;

use robusta_jni::bridge;

mod sign;

// statically formats a string by leaking memory,
// should only be used for a small number of times
fn leak_error_str(message: &str, error: Box<dyn Error>) -> &'static str {
    Box::leak(format!("{}: {}", message, error.as_ref()).into_boxed_str())
}

#[bridge]
mod jni {
    use c2pa::create_signer::from_keys_gsig;
    use gsig_rs::group_sig::algorithm::Algorithm;
    use robusta_jni::{
        convert::{FromJavaValue, IntoJavaValue, Signature, TryFromJavaValue, TryIntoJavaValue},
        jni::{
            errors::{Error as JniError, Result as JniResult},
            objects::AutoLocal,
        },
    };

    use crate::leak_error_str;
    use crate::sign::{image_sign_gsig, SigningError, verify_image_signature};

    #[derive(Signature, IntoJavaValue, TryIntoJavaValue, FromJavaValue, TryFromJavaValue)]
    #[package(com.libreal.android.signer)]
    pub struct NativeSigner<'env: 'borrow, 'borrow> {
        #[instance]
        instance: AutoLocal<'env, 'borrow>,
    }

    impl<'env: 'borrow, 'borrow> NativeSigner<'env, 'borrow> {
        pub extern "jni" fn isValidCredentials(
            groupPublicKey: Box<[u8]>,
            signingKey: Box<[u8]>,
        ) -> bool {
            from_keys_gsig(
                groupPublicKey.as_ref(),
                signingKey.as_ref(),
                Algorithm::BbsBls2020,
            )
            .is_ok()
        }

        #[call_type(safe(
            exception_class = "java.lang.RuntimeException",
            message = "Something went horribly wrong"
        ))]
        pub extern "jni" fn verifySignedImageInternal(
            signedImageBytes: Box<[u8]>,
        ) -> JniResult<Box<[u8]>> {
            match verify_image_signature(signedImageBytes) {
                // handle no errors
                Ok(None) => Ok(vec![].into_boxed_slice()), // `None = invalid signature` -> `empty byte array`
                Ok(Some((_, gpk))) => Ok(gpk.into_boxed_slice()), // return the group public key bytes

                // handle errors
                // our errors
                Err(signing_error) => match signing_error {
                    // handle expected errors
                    SigningError::UnsupportedImageType => Ok(vec![0].into_boxed_slice()), // `unsupported image type` -> `[0]`
                    SigningError::GroupSigAssertionMissing => Ok(vec![1].into_boxed_slice()), // `group signature assertion missing or corrupted` ->  `[1]`
                    SigningError::InvalidGroupSigCredentials => Ok(vec![2].into_boxed_slice()), // `cryptographically invalid group signature credentials` -> `[2]`

                    // handle IO errors
                    SigningError::IoError(e) => Err(JniError::NullPtr(leak_error_str(
                        "An I/O error occurred",
                        Box::new(e),
                    ))),

                    // handle all other errors
                    SigningError::LibrealError(libreal_error) => Err(JniError::NullPtr(
                        leak_error_str("Some other error occurred", Box::new(libreal_error)),
                    )),
                },
            }
        }

        #[call_type(safe(
            exception_class = "java.lang.RuntimeException",
            message = "Something went horribly wrong"
        ))]
        pub extern "jni" fn signImageStatic(
            groupPublicKey: Box<[u8]>,
            signingKey: Box<[u8]>,
            imageBytes: Box<[u8]>,
        ) -> JniResult<Box<[u8]>> {
            // create group signature signer from stored credentials
            let signer = match from_keys_gsig(
                groupPublicKey.as_ref(),
                signingKey.as_ref(),
                Algorithm::BbsBls2020,
            ) {
                Ok(s) => s,
                Err(e) => {
                    return Err(JniError::NullPtr(leak_error_str(
                        "The signer could not be constructed",
                        Box::new(e),
                    )))
                }
            };

            // sign this image and return the results
            match image_sign_gsig(signer, imageBytes) {
                Ok((_, s)) => Ok(s.into_boxed_slice()),

                Err(signing_error) => match signing_error {
                    // empty byte array represents unsupported image type error
                    SigningError::UnsupportedImageType => Ok(vec![].into_boxed_slice()),

                    // handle IO errors
                    SigningError::IoError(e) => Err(JniError::NullPtr(leak_error_str(
                        "An I/O error occurred",
                        Box::new(e),
                    ))),

                    // handle all other errors
                    SigningError::LibrealError(libreal_error) => Err(JniError::NullPtr(
                        leak_error_str("Some other error occurred", Box::new(libreal_error)),
                    )),
                    other => Err(JniError::NullPtr(leak_error_str(
                        "Some other error occurred",
                        Box::new(other),
                    ))),
                },
            }
        }
    }
}
