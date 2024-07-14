use std::ffi::OsStr;
use std::fs::read;
use std::io;
use std::io::Write;
#[cfg(test)]
use std::path::PathBuf;

use c2pa::{
    assertions::{Action, Actions, c2pa_action},
    C2paSigner,
    create_signer,
    GSigSigner, jumbf_io::remove_jumbf_from_file, Manifest, Reader as ManifestStore, SigningAlg,
};
#[cfg(test)]
use c2pa::create_signer::from_files_gsig;
use gsig_rs::bbs_group_sig::group_public_key::BbsBls2020GroupPublicKey;
use gsig_rs::bbs_group_sig::group_signature::BbsBls2020GroupSignature;
use gsig_rs::bbs_group_sig::signature_scheme::{
    BbsBls2020GroupSignatureScheme, DummyTransientGroupInfo,
};
#[cfg(test)]
use gsig_rs::group_sig::algorithm::Algorithm;
use gsig_rs::group_sig::group_traits::GroupSignatureScheme;
use infer::{get, Type as FileType};
use serde::{Deserialize, Serialize};
use tempfile::{Builder as TempFileBuilder, NamedTempFile};
use thiserror::Error as ThisError;

#[derive(ThisError, Debug)]
pub(crate) enum SigningError {
    // our errors
    #[error("invalid group signature credentials")]
    InvalidGroupSigCredentials,
    #[error("unsupported image type")]
    UnsupportedImageType,
    #[error("The group signature assertion was not found")]
    GroupSigAssertionMissing,

    // others
    #[error("error while performing IO: {0}")]
    IoError(#[from] io::Error),
    #[error("error while calling Libreal functions: {0}")]
    LibrealError(#[from] c2pa::Error),
}

pub(crate) type SigningResult<T> = Result<T, SigningError>;

#[derive(Serialize, Deserialize, Debug, Default)]
struct GSigAssertionData {
    group_pub_key: Vec<u8>,
    group_sig: Vec<u8>,
}

// ---- PUBLIC CONSTANTS ----

/// Optional prefix added to the generated Manifest Label
/// This is typically Internet domain name for the vendor
pub(crate) const VENDOR_PREFIX: &str = "veracity.labs";

/// A User Agent formatted string identifying the software/hardware/system produced this claim
/// Spaces are not allowed in names, versions can be specified with product/1.0 syntax
pub(crate) const CLAIM_GENERATOR: &str = "libreal/0.0.1";

/// Label for the group signature assertion
pub(crate) const GSIG_ASSERTION_LABEL: &str = "gsig.signature";

// ---- PRIVATE CONSTANTS ----

// constant paths to dummy certificates
const C2PA_SIGNCERT: &'static [u8] = r#"-----BEGIN CERTIFICATE-----
MIIChzCCAi6gAwIBAgIUcCTmJHYF8dZfG0d1UdT6/LXtkeYwCgYIKoZIzj0EAwIw
gYwxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTESMBAGA1UEBwwJU29tZXdoZXJl
MScwJQYDVQQKDB5DMlBBIFRlc3QgSW50ZXJtZWRpYXRlIFJvb3QgQ0ExGTAXBgNV
BAsMEEZPUiBURVNUSU5HX09OTFkxGDAWBgNVBAMMD0ludGVybWVkaWF0ZSBDQTAe
Fw0yMjA2MTAxODQ2NDBaFw0zMDA4MjYxODQ2NDBaMIGAMQswCQYDVQQGEwJVUzEL
MAkGA1UECAwCQ0ExEjAQBgNVBAcMCVNvbWV3aGVyZTEfMB0GA1UECgwWQzJQQSBU
ZXN0IFNpZ25pbmcgQ2VydDEZMBcGA1UECwwQRk9SIFRFU1RJTkdfT05MWTEUMBIG
A1UEAwwLQzJQQSBTaWduZXIwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQPaL6R
kAkYkKU4+IryBSYxJM3h77sFiMrbvbI8fG7w2Bbl9otNG/cch3DAw5rGAPV7NWky
l3QGuV/wt0MrAPDoo3gwdjAMBgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQMMAoGCCsG
AQUFBwMEMA4GA1UdDwEB/wQEAwIGwDAdBgNVHQ4EFgQUFznP0y83joiNOCedQkxT
tAMyNcowHwYDVR0jBBgwFoAUDnyNcma/osnlAJTvtW6A4rYOL2swCgYIKoZIzj0E
AwIDRwAwRAIgOY/2szXjslg/MyJFZ2y7OH8giPYTsvS7UPRP9GI9NgICIDQPMKrE
LQUJEtipZ0TqvI/4mieoyRCeIiQtyuS0LACz
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIICajCCAg+gAwIBAgIUfXDXHH+6GtA2QEBX2IvJ2YnGMnUwCgYIKoZIzj0EAwIw
dzELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAkNBMRIwEAYDVQQHDAlTb21ld2hlcmUx
GjAYBgNVBAoMEUMyUEEgVGVzdCBSb290IENBMRkwFwYDVQQLDBBGT1IgVEVTVElO
R19PTkxZMRAwDgYDVQQDDAdSb290IENBMB4XDTIyMDYxMDE4NDY0MFoXDTMwMDgy
NzE4NDY0MFowgYwxCzAJBgNVBAYTAlVTMQswCQYDVQQIDAJDQTESMBAGA1UEBwwJ
U29tZXdoZXJlMScwJQYDVQQKDB5DMlBBIFRlc3QgSW50ZXJtZWRpYXRlIFJvb3Qg
Q0ExGTAXBgNVBAsMEEZPUiBURVNUSU5HX09OTFkxGDAWBgNVBAMMD0ludGVybWVk
aWF0ZSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABHllI4O7a0EkpTYAWfPM
D6Rnfk9iqhEmCQKMOR6J47Rvh2GGjUw4CS+aLT89ySukPTnzGsMQ4jK9d3V4Aq4Q
LsOjYzBhMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgGGMB0GA1UdDgQW
BBQOfI1yZr+iyeUAlO+1boDitg4vazAfBgNVHSMEGDAWgBRembiG4Xgb2VcVWnUA
UrYpDsuojDAKBggqhkjOPQQDAgNJADBGAiEAtdZ3+05CzFo90fWeZ4woeJcNQC4B
84Ill3YeZVvR8ZECIQDVRdha1xEDKuNTAManY0zthSosfXcvLnZui1A/y/DYeg==
-----END CERTIFICATE-----
"#
.as_bytes();

const C2PA_PKEY: &'static [u8] = r#"-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgfNJBsaRLSeHizv0m
GL+gcn78QmtfLSm+n+qG9veC2W2hRANCAAQPaL6RkAkYkKU4+IryBSYxJM3h77sF
iMrbvbI8fG7w2Bbl9otNG/cch3DAw5rGAPV7NWkyl3QGuV/wt0MrAPDo
-----END PRIVATE KEY-----
"#
.as_bytes();

#[cfg(test)]
const TEST_BBS_GROUP_PKEY_PATH: &str = "test/bbs_bls_2020_gpk.bin";
#[cfg(test)]
const TEST_BBS_MEMBER_SIGNING_KEY_PATH: &str = "test/bbs_bls_2020_gmsk.bin";
#[cfg(test)]
const NO_MANIFEST_IMAGE_PATH: &str = "test/no_manifest.jpg";
#[cfg(test)]
const SIGNED_NO_MANIFEST_IMAGE_PATH: &str = "test/signed_no_manifest.jpg";

// ---- PUBLIC FUNCTIONS ----

/// with path to group public key and group member private key,
/// sign an image, returning the signed image bytes, and manifest store
pub(crate) fn image_sign_gsig<S: AsRef<dyn GSigSigner>, B: AsRef<[u8]>>(
    gsig_signer: S,
    image_bytes: B,
) -> SigningResult<(ManifestStore, Vec<u8>)> {
    // I physically don't know how to get the group signer to sign the image and
    // the C2PA store manifest claim associated with it.....
    // the problem is that while changing the signing logic was DOABLE
    // the verifying logic is SOOO infested with C2PA that there is no way to avoid it
    // so decided to sign with dummy credentials and put the real signature inside a claim
    // BUT, the trouble is that C2PA does signing and hashing in an INCREDIBLY awkward way,
    // whereby they don't hash anything (including the file) until the VEEEERYYYY end
    // and then sign that resulting structure and embed it into the file.
    // problem is, I can't intercept that and sign that hash, because I would have to re-embed
    // that assertion into the claim, changing the hash, making the whole thing not work.
    // its a catch 22 that can only be resolved with a much deeper understanding of C2PA,
    // so for now we are only signing the image itself :)

    // configure a manifest which will be signed
    let mut manifest: Manifest = {
        // create an `Actions` assertion, which contains a `CREATED` action
        let actions = &Actions::new().add_action(Action::new(c2pa_action::CREATED));

        // create manifest, and set properties, and manifest with assertions
        let mut manifest = Manifest::new(CLAIM_GENERATOR);
        manifest.set_vendor(VENDOR_PREFIX);
        manifest.add_assertion(actions)?;

        // retrieve group public key bytes, sign the image,
        // and construct a group signature assertion
        let group_pub_key = gsig_signer.as_ref().group_public_key()?;
        let group_sig = make_image_signature(gsig_signer, &image_bytes)?;
        manifest.add_labeled_assertion(
            GSIG_ASSERTION_LABEL,
            &GSigAssertionData {
                group_pub_key,
                group_sig,
            },
        )?;
        manifest
    };

    // embed the manifest into the image, sign and obtain the result
    let signed_image_bytes: Vec<u8> = {
        // create dummy c2pa signer, this doesn't matter as we only care about
        // the group signature inside the claim itself
        let c2pa_signer = create_dummy_c2pa_signer();

        // create temp files for input image, and output image
        let temp_input = temp_image(&image_bytes)?;
        let temp_output = tempfile_with_extension(
            temp_input
                .path()
                .extension()
                .ok_or(SigningError::UnsupportedImageType)?,
        )?;

        // sign and embed into the temp output file
        manifest.embed(
            temp_input.path(),
            temp_output.path(),
            c2pa_signer.as_signer(),
        )?;

        // read signed image bytes from the temp output file
        read(temp_output.path())?
    };

    // verify signed image bytes, returning them and the manifest store
    Ok((
        verify_image_signature(&signed_image_bytes)?
            .ok_or(c2pa::Error::OtherError(
                "the image signed but failed to verify, this should never happen".into(),
            ))?
            .0,
        signed_image_bytes,
    ))
}

/// Verifies that the signed image bytes are valid,
/// and if so returns the manifest store
///
/// Returns a [ManifestStore] and the Group Public Key bytes
pub(crate) fn verify_image_signature<B: AsRef<[u8]>>(
    signed_image_bytes: B,
) -> SigningResult<Option<(ManifestStore, Vec<u8>)>> {
    // get manifest store from image bytes
    let manifest_store = {
        let temp = temp_image(&signed_image_bytes)?;
        match ManifestStore::from_file(temp.path()) {
            Ok(m) => m,
            Err(c2pa::Error::IoError(e)) => Err(e)?,
            Err(c2pa::Error::UnsupportedType) => Err(SigningError::UnsupportedImageType)?,
            Err(_) => Err(SigningError::GroupSigAssertionMissing)?,
        }
    };

    // get group sig assertion data from manifest store
    let gsig_assertion_data = manifest_store
        .active_manifest()
        .ok_or(SigningError::GroupSigAssertionMissing)?
        .find_assertion::<GSigAssertionData>(GSIG_ASSERTION_LABEL)
        .map_err(|_| SigningError::GroupSigAssertionMissing)?;
    let gpk = BbsBls2020GroupPublicKey::from_bytes(&gsig_assertion_data.group_pub_key)
        .map_err(|_| SigningError::InvalidGroupSigCredentials)?;
    let gsig = BbsBls2020GroupSignature::from_bytes(&gsig_assertion_data.group_sig)
        .map_err(|_| SigningError::InvalidGroupSigCredentials)?;
    let image_bytes = get_clean_image_bytes(signed_image_bytes)?;

    // verify and return if correct
    Ok(
        if BbsBls2020GroupSignatureScheme::verify_signature(
            (&gpk, &DummyTransientGroupInfo::INSTANCE),
            &image_bytes,
            &gsig,
        ) {
            Some((manifest_store, gsig_assertion_data.group_pub_key))
        } else {
            None
        },
    )
}

// ---- PRIVATE FUNCTIONS ----

/// Creates a [C2paSigner] using default dummy credentials
fn create_dummy_c2pa_signer() -> Box<dyn C2paSigner> {
    // create signer using default credentials
    match create_signer::from_keys_c2pa(C2PA_SIGNCERT, C2PA_PKEY, SigningAlg::Es256, None) {
        Ok(s) => s,
        Err(_) => unreachable!("The default credentials are known, so this should never fail"),
    }
}

/// Signs *only* the image bytes (excluding any existing `JUMBF` data)
fn make_image_signature<S: AsRef<dyn GSigSigner>, B: AsRef<[u8]>>(
    signer: S,
    image_bytes: B,
) -> SigningResult<Vec<u8>> {
    // get clean image bytes
    let image_bytes = get_clean_image_bytes(image_bytes)?;

    // sign the clean image bytes, and return pubkey and signature
    let signer = signer.as_ref();
    Ok(signer.sign(&image_bytes)?)
}

/// Removes existing `JUMBF` data from image, and return resulting clean image bytes
fn get_clean_image_bytes<B: AsRef<[u8]>>(image_bytes: B) -> SigningResult<Vec<u8>> {
    // create named temp file and write image bytes to it
    let temp = temp_image(&image_bytes)?;

    // clean up the image bytes in temp file
    match remove_jumbf_from_file(temp.path()) {
        Err(c2pa::Error::UnsupportedType) => Err(SigningError::UnsupportedImageType)?,
        Err(e) => Err(SigningError::LibrealError(e))?,
        _ => {}
    }

    // return the clean image bytes from temp file
    Ok(read(temp.path())?)
}

fn temp_image<B: AsRef<[u8]>>(image_bytes: B) -> SigningResult<NamedTempFile> {
    tempfile_with_extension(image_type(&image_bytes)?.extension()).and_then(|mut f| {
        f.write_all(image_bytes.as_ref())?;
        Ok(f)
    })
}

fn tempfile_with_extension<S: AsRef<OsStr> + ?Sized>(
    extension: &S,
) -> SigningResult<NamedTempFile> {
    Ok(TempFileBuilder::new()
        .suffix(
            format!(
                ".{}",
                extension
                    .as_ref()
                    .to_str()
                    .ok_or(SigningError::UnsupportedImageType)?
            )
            .as_str(),
        )
        .tempfile()?)
}

fn image_type<B: AsRef<[u8]>>(image_bytes: B) -> SigningResult<FileType> {
    get(image_bytes.as_ref()).ok_or(SigningError::UnsupportedImageType)
}
// ---- TESTS ----

#[test]
pub(crate) fn no_manifest_jpg_sign_and_verify() {
    // get signer from test files
    let gsig_signer = from_files_gsig(
        PathBuf::from(TEST_BBS_GROUP_PKEY_PATH),
        PathBuf::from(TEST_BBS_MEMBER_SIGNING_KEY_PATH),
        Algorithm::BbsBls2020,
    )
    .unwrap();

    // get test image from file, and verify it
    let image_bytes = read(NO_MANIFEST_IMAGE_PATH).unwrap();
    image_sign_gsig(gsig_signer, image_bytes).unwrap();
}

#[test]
pub(crate) fn signed_no_manifest_jpg_verify() {
    let signed_image_bytes = read(SIGNED_NO_MANIFEST_IMAGE_PATH).unwrap();
    verify_image_signature(signed_image_bytes).unwrap();
}
