pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // LiveKit's Android SDK pulls in a transitive dependency
        // (com.github.davidliu:audioswitch) published only on JitPack.
        maven("https://jitpack.io")
    }
}

rootProject.name = "Vibely"
include(":app")
