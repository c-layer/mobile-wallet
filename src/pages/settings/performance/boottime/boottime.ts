import { Component } from '@angular/core';
import { LoaderProvider } from '../../../../providers/loader';

@Component({
  selector: 'page-boottime',
  templateUrl: 'boottime.html',
})
export class BootTimePage {

  constructor(public loaderProvider: LoaderProvider) {
  }

}
