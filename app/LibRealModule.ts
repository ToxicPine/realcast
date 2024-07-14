import { requireNativeModule } from "expo-modules-core";

export interface LibRealModule {
    isValidCredentialsStatic(
        groupPublicKey: Uint8Array,
        signingKey: Uint8Array): boolean;
    verifyImageStatic(imageBytes: Uint8Array): Uint8Array | null;
    initDynamic(
        groupPublicKey: Uint8Array,
        signingKey: Uint8Array): void;
    signImageDynamic(imageBytes: Uint8Array): Uint8Array;
    verifyImageDynamic(imageBytes: Uint8Array): boolean;
}

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
export default requireNativeModule("LibRealModule") as LibRealModule;