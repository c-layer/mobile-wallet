import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-success',
  templateUrl: 'success.html'
})
export class SuccessPage {
  private target: any;
  public message: string;

  constructor(private navCtrl: NavController, private navParams: NavParams) {}

  next() {
    this.navCtrl.setRoot(this.target);
  }

  ionViewDidEnter() {
    this.target = this.navParams.get('target');
    this.message = this.navParams.get('message');
    setTimeout(() => {
      this.next();
    }, 2500);
  }
}
