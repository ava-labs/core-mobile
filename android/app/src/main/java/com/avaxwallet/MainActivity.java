package com.avaxwallet;

import android.os.Bundle;
import android.view.View;
import android.widget.FrameLayout;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {

  private View privacyView;
  private boolean isPrivacyViewOn = false;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
//    getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    privacyView = View.inflate(this, R.layout.privacy_layout, null);

  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
  }

  @Override
  protected void onPause() {
    super.onPause();
    FrameLayout rootLayout = (FrameLayout)findViewById(android.R.id.content);
    rootLayout.addView(privacyView);
    isPrivacyViewOn = true;
  }

  @Override
  protected void onResume() {
    super.onResume();
    if (isPrivacyViewOn) {
      FrameLayout rootLayout = (FrameLayout)findViewById(android.R.id.content);
      rootLayout.removeViewAt(rootLayout.getChildCount()-1);
      isPrivacyViewOn = false;
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "AvaxWallet";
  }
}
