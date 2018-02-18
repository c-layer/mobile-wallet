import { Injectable } from '@angular/core';
import { Web3Provider } from './web3';
import 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import { ProfileProvider } from './profile';

@Injectable()
export class NetworkProvider {

    constructor(private profileProvider: ProfileProvider,
        private web3Provider: Web3Provider) { }

    public getActiveNetworks() {
        let activeNetwork;
        this.profileProvider.getProfile().networks.forEach(network => {
            if (network.active) {
                activeNetwork = network;
            }
        });
        return activeNetwork;
    }

    public updateNetworks(networkName: string) {
        if (this.getActiveNetworks().name != networkName) {
            let profile = this.profileProvider.getProfile();
            profile.networks.forEach(network => {
                if (network.name == networkName) {
                    network.active = true;
                } else {
                    network.active = false;
                }
            });
            this.profileProvider.setNetworks(profile.networks);
        }
    }

    public getNodeInfo(networkName: string): Promise<any> {
        let web3 = null;
        switch (networkName) {
            case 'ETH':
                web3 = this.web3Provider.getEthProvider();
                break;
            case 'RSK':
                web3 = this.web3Provider.getRskProvider();
                break;
            default:
                throw 'Invalid network name \'' + networkName + '\'';
        }

        return Promise.all([
            web3.eth.getBlock('latest'),
            web3.eth.getGasPrice(),
            web3.eth.net.getPeerCount()
        ]).then(data => {
            return {
                block: data[0],
                gasPrice: data[1],
                peerCount: data[2]
            };
        }).catch(err => {
            console.log(err);
        });;
    }
}