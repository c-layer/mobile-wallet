declare function require(moduleName: string): any;
const Web3 = require("web3");

import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { ProfileProvider } from './profile';

@Injectable()
export class Web3Provider {
  private eth = {
    web3: null,
    blockNumber: null
  };
  private rsk = {
    web3: null,
    blockNumber: null
  };

  private readySubject: ReplaySubject<void> = new ReplaySubject(1);

  constructor(private profileProvider: ProfileProvider) {
  }

  getAccounts() {
    return this.eth.web3.accounts;
  }

  encodeAddress(address: string): string {
    return this.eth.web3.eth.abi.encodeParameter('address', address);
  }

  getEthProvider() {
    return this.eth.web3;
  }

  getRskProvider() {
    return this.rsk.web3;
  }

  public sendSignedTransaction(web3: any, fromAddress: string, fromPKey: string,
    toAddress: string, value: number, contractData: string) {
    return Observable.fromPromise(
      Promise.all([
        web3.eth.getTransactionCount(fromAddress),
        web3.eth.getGasPrice(),
        web3.eth.net.getId()
      ]).then(data => {
        let account = web3.eth.accounts.privateKeyToAccount(fromPKey);
        web3.eth.accounts.wallet.add(account);
        let txParams = {
          from: account.address,
          nonce: data[0],
          gas: 30000,
          gasPrice: data[1],
          to: toAddress,
          chainId: data[2]
        };
        if (value) {
          txParams['value'] = value;
        }
        if (contractData) {
          txParams['data'] = contractData;
          txParams.gas = (300000);
        }
        return web3.eth.sendTransaction(txParams)
          .on('transactionHash', function (hash) {
            console.log(hash);
          })
          .on('receipt', function (receipt) {
          })
          .on('error', console.error);
      }));
  }

  public whenReady(): Observable<any> {
    return this.readySubject;
  }

  start() {
    this.rsk.web3 = new Web3(new Web3.providers.HttpProvider("http://163.172.104.223:4444"));
    this.eth.web3 = new Web3(new Web3.providers.WebsocketProvider("ws://163.172.104.223:1004"));

    this.rsk.web3.eth.getBlockNumber().then(number =>
      this.rsk.blockNumber = number
    );
    this.eth.web3.eth.getBlockNumber().then(number =>
      this.eth.blockNumber = number
    );

    this.readySubject.next(null);
    this.readySubject.complete;
  }
}