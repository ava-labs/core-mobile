package com.avaxwallet

import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import java.io.IOException


class UserAgentInterceptor(private val userAgent: String) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest: Request = chain.request()

        if (userAgent.isNotEmpty()) {
            val updatedRequest = originalRequest.newBuilder()
                .removeHeader("User-Agent")
                .addHeader("User-Agent", userAgent)
                .build()
            return chain.proceed(updatedRequest)
        } else {
            return chain.proceed(originalRequest)
        }
    }
}