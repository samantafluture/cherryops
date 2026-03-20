package com.cherryops.app.core.network

import com.cherryops.app.BuildConfig
import com.cherryops.app.feature.dispatch.BaseUrlProvider
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BaseUrlProviderImpl @Inject constructor() : BaseUrlProvider {
    override fun getBaseUrl(): String = BuildConfig.BACKEND_BASE_URL
}
