package com.avaxwallet

import android.os.Bundle
import android.view.View
import android.widget.FrameLayout

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash;

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "AvaxWallet"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    private var privacyView: View? = null
    private var isPrivacyViewOn = false

    override fun onCreate(savedInstanceState: Bundle?) {
        RNBootSplash.init(this, R.style.BootTheme)
        super.onCreate(null)
        privacyView = View.inflate(this, R.layout.privacy_layout, null)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
    }

    override fun onPause() {
        super.onPause()
        val rootLayout = findViewById<FrameLayout>(android.R.id.content)
        rootLayout.addView(privacyView)
        isPrivacyViewOn = true
    }

    override fun onResume() {
        super.onResume()
        if (isPrivacyViewOn) {
            val rootLayout = findViewById<FrameLayout>(android.R.id.content)
            rootLayout.removeViewAt(rootLayout.childCount - 1)
            isPrivacyViewOn = false
        }
    }
}