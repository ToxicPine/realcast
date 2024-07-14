1. copy `lib_real` and `gsig-rs` into `rust-lib/lib`
2. do this:

```
rustup target add armv7-linux-androideabi   # for arm
rustup target add i686-linux-android        # for x86
rustup target add aarch64-linux-android     # for arm64
rustup target add x86_64-linux-android      # for x86_64
```

3. install any pre-requisite android studio stuff like the NDK, and possibly update the gradle build file to match your version of the NDK.
4. install any build dependencies you might need for Rust, like Pearl which is needed for Open SSL (for some reason...)
