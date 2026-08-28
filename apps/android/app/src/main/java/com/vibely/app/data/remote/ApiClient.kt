package com.vibely.app.data.remote

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    const val BASE_URL = "http://10.0.2.2:4000"

    fun create(): ApiService {
        return Retrofit.Builder()
            .baseUrl("$BASE_URL/api/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
