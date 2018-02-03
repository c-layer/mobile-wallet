import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LandingPage } from '../pages/landing/landing';
import { LoaderProvider } from '../providers/loader';
import { TabsPage } from '../pages/tabs/tabs';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen,
    loaderProvider: LoaderProvider) {

    loaderProvider.start().subscribe((profile) => {
      if (profile) {
        this.rootPage = TabsPage;
        //this.rootPage = WalletSecurePage;
      } else {
        this.rootPage = LandingPage;
      }
      loaderProvider.setStatus('rootPageDefined');

      platform.ready().then(() => {
        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.
        statusBar.overlaysWebView(false);
        statusBar.backgroundColorByHexString("#063447");

        splashScreen.hide();
        loaderProvider.setStatus('platformReady');
      });
    });
    loaderProvider.setStatus('platformStarting');
  }
}

