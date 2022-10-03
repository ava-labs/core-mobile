package com.avaxwallet;

import android.os.Bundle;
import android.view.View;
import android.widget.FrameLayout;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;

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

  /**
   * Returns the instance of the {@link ReactActivityDelegate}. There the RootView is created and
   * you can specify the renderer you wish to use - the new renderer (Fabric) or the old renderer
   * (Paper).
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new MainActivityDelegate(this, getMainComponentName());
  }

  public static class MainActivityDelegate extends ReactActivityDelegate {
    public MainActivityDelegate(ReactActivity activity, String mainComponentName) {
      super(activity, mainComponentName);
    }

    @Override
    protected ReactRootView createRootView() {
      ReactRootView reactRootView = new ReactRootView(getContext());
      // If you opted-in for the New Architecture, we enable the Fabric Renderer.
      reactRootView.setIsFabric(BuildConfig.IS_NEW_ARCHITECTURE_ENABLED);
      return reactRootView;
    }

    @Override
    protected boolean isConcurrentRootEnabled() {
      // If you opted-in for the New Architecture, we enable Concurrent Root (i.e. React 18).
      // More on this on https://reactjs.org/blog/2022/03/29/react-v18.html
      return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
    }
  }
}
