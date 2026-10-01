# --- App models ---------------------------------------------------------
# DTOs and realtime payloads are (de)serialized reflectively by Gson; R8 must
# not rename or strip their fields.
-keep class com.vibely.app.data.** { *; }

# --- Gson / Retrofit ----------------------------------------------------
-keepattributes Signature, InnerClasses, EnclosingMethod, *Annotation*
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
# R8 full mode strips generic signatures from suspend Retrofit methods.
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation
-dontwarn retrofit2.**
-dontwarn okhttp3.**
-dontwarn okio.**

# --- WebRTC / LiveKit (JNI) ---------------------------------------------
-keep class org.webrtc.** { *; }
-keep class livekit.** { *; }
-keep class io.livekit.** { *; }
-dontwarn org.webrtc.**

# --- Socket.IO ----------------------------------------------------------
-keep class io.socket.** { *; }
-dontwarn io.socket.**

# --- Razorpay -----------------------------------------------------------
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**
-keep class proguard.annotation.Keep
-keep class proguard.annotation.KeepClassMembers
-optimizations !method/inlining/*
