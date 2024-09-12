package com.avaxwallet

import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.ReactCookieJarContainer
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit;


class CoreOkHttpClientFactory(private val userAgent: String) : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        // No timeouts by default
        return OkHttpClient.Builder()
            .cookieJar(ReactCookieJarContainer())
            .addInterceptor(UserAgentInterceptor(userAgent))
            .connectTimeout(0, TimeUnit.MILLISECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .writeTimeout(0, TimeUnit.MILLISECONDS)
            .build()
    }
}

