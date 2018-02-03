import {Component} from '@angular/core';
import {AccountsPage} from '../accounts/accounts';
import {PortfolioPage} from '../portfolio/portfolio';
import {SettingsPage} from "../settings/settings";
import {ScanPage} from '../scan/scan';
import { LoaderProvider } from '../../providers/loader';

@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {
  tabsRoot = [ PortfolioPage, AccountsPage, ScanPage, SettingsPage];

  isVisible() {
    return false;
  }

  constructor(private loaderProvider: LoaderProvider) {
    loaderProvider.setStatus('TabsLoaded');
   }

  ionViewDidEnter() {
    this.loaderProvider.setStatus('tabsDisplayed');
  }
}
