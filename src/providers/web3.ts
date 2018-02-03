declare function require(moduleName: string): any;
const Web3 = require("web3");

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs';

@Injectable()
export class Web3Provider {
  private web3;
  private latestBlockNumber: number;
  private readySubject: ReplaySubject<void> = new ReplaySubject(1);
  private latestBlockObs: ReplaySubject<any>;
  private txsSubject: BehaviorSubject<any>;

  private transactions: Array<any> = [];

  getLatestBlockNumber(): number {
    return this.latestBlockNumber;
  }

  blockData(): Observable<any> {
    return this.latestBlockObs;
  }

  txsData(): Observable<any> {
    return this.txsSubject;
  }

  public getContract(abi: any, address: string): any {
    if(abi != null && address != null) {
      return new this.web3.eth.Contract(abi, address);      
    }
    return null;
  }

  getUtils() {
    return this.web3.utils;
  }

  getAccounts() {
    if(!this.web3) {
      this.start();
    }
    return this.web3.eth.accounts;
  }

  getBalance(address: string) {
    return this.web3.eth.getBalance(address);
  }

  public encodeAddress(address: string): string {
    return this.web3.eth.abi.encodeParameter('address', address);
  }

  sendSignedTransaction(fromAddress: string, fromPKey: string,
    toAddress: string, value: number, contractData: string) {
    let web3 = this.web3;
    let transactions = this.transactions;
    let txsSubject = this.txsSubject;
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
        console.log(txParams);
        return web3.eth.sendTransaction(txParams)
          .on('transactionHash', function (hash) {
            console.log(hash);
            transactions.push({
              from: txParams.from,
              to: txParams.to,
              hash: hash,
              blockNumber: null,
              status: 'CREATED'
            });
            txsSubject.next({ transactions: transactions });
          })
          .on('receipt', function (receipt) {
            transactions.map(tx => {
              if (tx.status == 'CREATED' && tx.hash == receipt.transactionHash) {
                tx.status = 'PENDING';
                txsSubject.next({ transactions: transactions });
              }
            });
          })
          .on('error', console.error);
      }));
  }

  private buildLatestBlockObs(): ReplaySubject<any> {
    let subject = new ReplaySubject<any>(1);

    this.web3.eth.getBlock('latest').then(block => {
      subject.next(block);
    })

    this.web3.eth.subscribe('newBlockHeaders', (error, value) => {
      if (error) {
        subject.error(error);
      } else {
        this.latestBlockNumber = value.number;
        this.web3.eth.getBlock(value.number).then(block => {
          this.transactions.map(tx => {
            if (tx.status != 'UNCONFIRMED'
              && block.transactions.filter(tx => tx.transactionHash == tx.hash).length == 1) {
              tx.blockNumber = block.number;
              tx.status = 'UNCONFIRMED';
              this.txsSubject.next({ transactions: this.transactions });
            }
            if (tx.status == 'UNCONFIRMED' && (block.number - tx.blockNumber >= 3)) {
              tx.status = 'COMPLETED';
              this.txsSubject.next({ transactions: this.transactions });
            }
          });
        });
        subject.next(value);
      }
    });
    return subject;
  }

  public whenReady(): Observable<any> {
    return this.readySubject;
  }

  start() {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider("ws://163.172.104.223:1004"));

    this.web3.eth.getBlockNumber().then(number =>
      this.latestBlockNumber = number
    );
    this.txsSubject = new BehaviorSubject<any>({ transactions: this.transactions });
    this.latestBlockObs = this.buildLatestBlockObs();

    this.readySubject.next(null);
    this.readySubject.complete;
  }
}