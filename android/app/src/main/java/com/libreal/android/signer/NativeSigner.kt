package com.libreal.android.signer

import android.content.res.AssetManager
import com.libreal.android.signer.NativeSigner.Companion.isValidCredentials

/**
 * Creates [NativeSigner] instance using the default credentials in the `/assets` folder
 */
fun createDefaultSigner(assetManager: AssetManager) = NativeSigner(
    assetManager.open("bbs_bls_2020_gpk.bin").readBytes(),
    assetManager.open("bbs_bls_2020_gmsk.bin").readBytes()
)

/**
 * Creates a new BBS+ signer of images, using the native `libreal-rs` library
 *
 * @throws InvalidCredentials if [isValidCredentials] returns `false`,
 * i.e. if the credentials are cryptographically invalid
 */
class NativeSigner @Throws(InvalidCredentials::class) constructor(
    groupPublicKey: ByteArray,
    signingKey: ByteArray
) {
    companion object {
        init {
            System.loadLibrary("rustlibreal")
        }

        /**
         * Checks if a supplied Group Public Key, and Member Signing Key
         * are cryptographically valid or not
         */
        @JvmStatic
        external fun isValidCredentials(
            groupPublicKey: ByteArray,
            signingKey: ByteArray
        ): Boolean

        /**
         * Checks if a signed image has a valid group signature,
         * returning the corresponding group public key bytes, or `null` if invalid.
         *
         * **NOTE**: this method should always be called in a try-catch block
         *
         * @throws [UnsupportedImageType] if the image type is unsupported
         * @throws [InvalidCredentials] if the group signature assertion missing or corrupted,
         * or group signature credentials are cryptographically invalid
         */
        @JvmStatic
        @Throws(SignerError::class)
        fun verifySignedImageStatic(signedImageBytes: ByteArray): ByteArray? {
            // call internal native function
            val gpk = verifySignedImageInternal(signedImageBytes)

            // perform error handling
            if (gpk.isEmpty()) return null
            if (gpk.size == 1) {
                when (val res = gpk[0]) {
                    0.toByte() -> throw UnsupportedImageType()
                    1.toByte(), 2.toByte() ->
                        throw InvalidCredentials("Group signature assertion missing or corrupted, or group signature credentials are cryptographically invalid")

                    else -> // catch cases that should never happen
                        throw IllegalStateException("The return value `$res` should never be returned from `verifySignedImageInternal` native JNI method")
                }
            }

            // return the group public key
            return gpk
        }

        /**
         * Returns the signed image bytes, or an empty [ByteArray] if the image type is unsupported;
         * @throws [RuntimeException] if something completely unexpected happens
         */
        @JvmStatic
        @Throws(RuntimeException::class)
        private external fun signImageStatic(
            groupPublicKey: ByteArray,
            signingKey: ByteArray,
            imageBytes: ByteArray
        ): ByteArray

        /**
         * Checks if an image has a manifest and verifies its validity,
         * returning the group public key bytes, or encoding an error as:
         *
         * - `[]`: the signature is invalid with respect to group public key
         * - `[0]`: the image type is unsupported
         * - `[1]`: group signature assertion missing or corrupted
         * - `[2]`: cryptographically invalid group signature credentials
         */
        @JvmStatic
        private external fun verifySignedImageInternal(signedImageBytes: ByteArray): ByteArray
    }

    // create immutable copy of the supplied credentials
    // and provide immutable copies upon access
    private val groupPublicKey: ByteArray = groupPublicKey
        get() = field.clone()
    private val signingKey: ByteArray = signingKey
        get() = field.clone()

    init {
        // validate credentials upon initialization
        if (!isValidCredentials(this.groupPublicKey, this.signingKey))
            throw InvalidCredentials("Invalid group signature credentials supplied")
    }

    /**
     * Signs the image bytes, and returns the result
     *
     * @throws [UnsupportedImageType] if the image type is unsupported
     */
    @Throws(UnsupportedImageType::class)
    fun signImage(imageBytes: ByteArray): ByteArray {
        // sign image, and check for any errors
        val signedImageBytes = signImageStatic(groupPublicKey, signingKey, imageBytes)
        if (signedImageBytes.isEmpty()) throw UnsupportedImageType()

        // return signed image bytes
        return signedImageBytes
    }

    /**
     * Checks if a signed image was has a valid group signature corresponding to the credentials
     * of this signer, returning the appropriate boolean value
     *
     * **NOTE**: this method should always be called in a try-catch block
     *
     * @throws [UnsupportedImageType] if the image type is unsupported
     * @throws [InvalidCredentials] if the group signature assertion missing or corrupted,
     * or group signature credentials are cryptographically invalid
     */
    @Throws(SignerError::class)
    fun verifySignedImage(signedImageBytes: ByteArray): Boolean =
        verifySignedImageStatic(signedImageBytes)?.equals(groupPublicKey)
            ?: false
}