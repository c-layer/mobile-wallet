import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ProfileProvider } from '../../providers/profile';
import { NetworkProvider } from '../../providers/network';

@Component({
  selector: 'page-node-details',
  templateUrl: 'node-details.html',
})
export class NodeDetailsPage {
  public node: any = {};
  public block: any;

  constructor(private navCtrl: NavController, private navParams: NavParams,
    private profileProvider: ProfileProvider, private networkProvider: NetworkProvider) { }

  ionViewWillEnter() {
    let nodeName = this.navParams.get('nodeName');

    this.profileProvider.getProfile().networks.forEach(network => {
      if(network.active) {
        this.node = network[nodeName];
      }
    });

    this.networkProvider.getNodeInfo(nodeName).then(result => {
      if(result) {
        this.node.blockNumber = result.block.number;
        this.node.peerCount = result.peerCount;
        this.node.gasPrice = result.gasPrice;
        this.block = result.block;
      }
    })
  }

  ionViewDidLeave() {
    this.navCtrl.popToRoot();
  }
}
