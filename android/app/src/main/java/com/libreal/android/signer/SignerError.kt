package com.libreal.android.signer

/**
 * An error that happens when operating the [NativeSigner]
 */
sealed class SignerError : RuntimeException {
    constructor(message: String) : super(message)
    constructor(message: String, cause: Throwable) : super(message, cause)
    constructor(
        message: String,
        cause: Throwable,
        enableSuppression: Boolean,
        writableStackTrace: Boolean
    ) : super(message, cause, enableSuppression, writableStackTrace)
}

/**
 * Credentials supplied to the [NativeSigner] were invalid
 */
class InvalidCredentials : SignerError {
    companion object {
        private const val DEFAULT_MESSAGE: String = "The supplied credentials are invalid"
    }

    constructor() : super(DEFAULT_MESSAGE)
    constructor(message: String) : super(message)
    constructor(message: String, cause: Throwable) : super(message, cause)
    constructor(cause: Throwable) : super(DEFAULT_MESSAGE, cause)
    constructor(
        message: String,
        cause: Throwable,
        enableSuppression: Boolean,
        writableStackTrace: Boolean
    ) : super(message, cause, enableSuppression, writableStackTrace)
}

/**
 * The image type is unsupported by the current
 */
class UnsupportedImageType : SignerError {
    companion object {
        private const val DEFAULT_MESSAGE: String =
            "The image type is currently unsupported for signing"
    }

    constructor() : super(DEFAULT_MESSAGE)
    constructor(message: String) : super(message)
    constructor(message: String, cause: Throwable) : super(message, cause)
    constructor(cause: Throwable) : super(DEFAULT_MESSAGE, cause)
    constructor(
        message: String,
        cause: Throwable,
        enableSuppression: Boolean,
        writableStackTrace: Boolean
    ) : super(message, cause, enableSuppression, writableStackTrace)
}