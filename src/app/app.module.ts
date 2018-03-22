import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { AccountsPage } from "../pages/accounts/accounts";
import { AccountDetailsPage } from "../pages/details/account-details/account-details";
import { PortfolioPage } from '../pages/portfolio/portfolio';
import { TabsPage } from '../pages/tabs/tabs';
import { TransferPage } from '../pages/transfer/transfer';
import { SettingsPage } from "../pages/settings/settings";
import { PortfolioDetailsPage } from "../pages/portfolio-details/portfolio-details";
import { LandingPage } from '../pages/landing/landing';
import { ScanPage } from '../pages/scan/scan';
import { SuccessPage } from '../pages/success/success';
import { WalletBackupPage } from '../pages/wallet/wallet-backup/wallet-backup';
import { WalletCreationPage } from '../pages/wallet/wallet-creation/wallet-creation';
import { WalletDetailsPage } from '../pages/wallet/wallet-details/wallet-details';
import { WalletMnemonicPage } from '../pages/wallet/wallet-mnemonic/wallet-mnemonic';
import { WalletSecurePage } from '../pages/wallet/wallet-secure/wallet-secure';

import { HeaderComponent } from '../components/header/header';

import { AccountProvider } from '../providers/account';
import { FormatProvider } from '../providers/format';
import { CurrencyProvider } from '../providers/currency';
import { LoaderProvider } from '../providers/loader';
import { ProfileProvider } from '../providers/profile';
import { Web3Provider } from '../providers/web3';
import { IonicStorageModule } from '@ionic/storage';
import { NetworkProvider } from '../providers/network';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { NotificationsProvider } from '../providers/notifications';
import { ExplorerProvider } from '../providers/explorer';
import { NetworksPage } from '../pages/settings/networks/networks';
import { NodeDetailsPage } from '../pages/node-details/node-details';
import { BootTimePage } from '../pages/settings/performance/boottime/boottime';
import { SocialSharing } from '@ionic-native/social-sharing';

@NgModule({
  declarations: [
    MyApp,
    AccountsPage,
    AccountDetailsPage,
    BootTimePage,
    LandingPage,
    NetworksPage,
    NodeDetailsPage,
    PortfolioPage,
    PortfolioDetailsPage,
    SettingsPage,
    ScanPage,
    SuccessPage,
    TabsPage,
    TransferPage,
    WalletBackupPage,
    WalletCreationPage,
    WalletDetailsPage,
    WalletMnemonicPage,
    WalletSecurePage,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    NgxQRCodeModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AccountsPage,
    AccountDetailsPage,
    BootTimePage,
    LandingPage,
    NetworksPage,
    NodeDetailsPage,
    PortfolioPage,
    PortfolioDetailsPage,
    SettingsPage,
    ScanPage,
    SuccessPage,
    TransferPage,
    TabsPage,
    TransferPage,
    WalletBackupPage,
    WalletCreationPage,
    WalletDetailsPage,
    WalletMnemonicPage,
    WalletSecurePage,
  ],
  providers: [
    AccountProvider,
    BarcodeScanner,
    CurrencyProvider,
    ExplorerProvider,
    FormatProvider,
    LoaderProvider,
    ProfileProvider,
    NetworkProvider,
    NotificationsProvider,
    SocialSharing,
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    Web3Provider
  ]
})
export class AppModule {}
