package com.vibely.app.data.remote

import android.content.Context
import com.vibely.app.data.local.TokenManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private const val BASE_URL = "https://vibely-backend-production-99a5.up.railway.app/api/"

    /** Base URL for Socket.IO connections (no trailing `/api`). */
    fun socketBaseUrl(): String = BASE_URL.removeSuffix("/api/")

    @Volatile
    private var retrofit: Retrofit? = null

    private fun authInterceptor(tokenManager: TokenManager): Interceptor {
        return Interceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
            val token = tokenManager.getAccessToken()
            if (token != null) {
                requestBuilder.addHeader("Authorization", "Bearer $token")
            }
            chain.proceed(requestBuilder.build())
        }
    }

    fun getClient(context: Context): ApiService {
        val tokenManager = TokenManager(context)
        if (retrofit == null) {
            synchronized(ApiClient::class) {
                if (retrofit == null) {
                    val logging = HttpLoggingInterceptor()
                    logging.level = HttpLoggingInterceptor.Level.BODY

                    val client = OkHttpClient.Builder()
                        .addInterceptor(authInterceptor(tokenManager))
                        .addInterceptor(logging)
                        .connectTimeout(30, TimeUnit.SECONDS)
                        .readTimeout(30, TimeUnit.SECONDS)
                        .writeTimeout(30, TimeUnit.SECONDS)
                        .build()

                    retrofit = Retrofit.Builder()
                        .baseUrl(BASE_URL)
                        .client(client)
                        .addConverterFactory(GsonConverterFactory.create())
                        .build()
                }
            }
        }
        return retrofit!!.create(ApiService::class.java)
    }
}
