package expo.modules.libreal

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LibRealModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("LibRealModule")

        Function("sampleMethod") {
            "Hello from Kotlin"
        }
    }
}
