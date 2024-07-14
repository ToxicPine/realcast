package expo.modules.libreal

import com.libreal.android.signer.NativeSigner
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LibRealModule : Module() {
    private var signer: NativeSigner? = null

    override fun definition() = ModuleDefinition {
        Name("LibRealModule")

        Function("isValidCredentialsStatic") {
                groupPublicKey: ByteArray,
                signingKey: ByteArray ->
            NativeSigner.isValidCredentials(groupPublicKey, signingKey)
        }

        Function("verifyImageStatic") { imageBytes: ByteArray ->
            NativeSigner.verifySignedImageStatic(imageBytes) // TODO: alter error handling
        }

        Function("initDynamic") {
            groupPublicKey: ByteArray,
            signingKey: ByteArray ->
            signer = NativeSigner(groupPublicKey, signingKey) // TODO: alter error handling
        }

        Function("signImageDynamic") { imageBytes: ByteArray ->
            signer!!.signImage(imageBytes); // TODO: alter error handling
        }

        Function("verifyImageDynamic") { imageBytes: ByteArray ->
            signer!!.verifySignedImage(imageBytes) // TODO: alter error handling
        }
    }
}
