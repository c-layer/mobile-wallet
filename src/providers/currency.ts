declare function require(moduleName: string): any;
const MtPelerinTokens = require('../assets/contracts/MtPelerinTokens.json');
const FiatToken = require('../assets/contracts/FiatToken.json');

import { Injectable } from '@angular/core';
import { Web3Provider } from './web3';
import { Account } from '../model/account';
import { Currency } from '../model/currency';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import { ProfileProvider } from './profile';
import { AccountProvider } from './account';
import { AccountToken } from '../model/account-token';
import { ExplorerProvider } from './explorer';

@Injectable()
export class CurrencyProvider {
  public currencies: Currency[] = [];

  constructor(private web3Provider: Web3Provider,
    private profileProvider: ProfileProvider,
    private accountProvider: AccountProvider,
    private explorerProvider: ExplorerProvider) {
  }

  public getCurrencyById(id: number): Currency {
    if (this.currencies && this.currencies.length > id) {
      return this.currencies[id];
    }
    return null;
  }

  public getCurrencyBySymbol(network: string, symbol: string): Currency {
    let found = null;
    if (this.currencies) {
      this.currencies.forEach(currency => {
        if (currency.symbol == symbol && currency.network == network) {
          found = currency;
        }
      });
    }
    return found;
  }

  public getCurrencyName(address: string) {
    let name = address;
    if (address) {
      this.currencies.forEach(currency => {
        if (currency.address == address) {
          name = currency.name;
        }
      })
    }
    return name;
  }

  public portfolioObs(account: Account): Observable<AccountToken[]> {
    /*console.log(this.web3Provider.encodeAddress(account.address));
    this.web3Provider.getRskProvider().eth.getPastLogs(
      { 
        fromBlock: 'earliest', //this.web3Provider.getRskProvider().utils.toHex(152896),
        toBlock: 'latest', //this.web3Provider.getRskProvider().utils.toHex(153896),
        address: '0x0000000000000000000000000000000001000006',
        topics: [ '0x00000000000000007570646174655f636f6c6c656374696f6e735f746f706963', null, null, null]
//        topics: [null, this.web3Provider.encodeAddress(account.address), null, null]
      },
      (err, data) => { 
        console.log(err);
        let count = {};
        data.forEach(log  => {
          if(count[log.data]) {
            count[log.data] += 1;
          } else {
            count[log.data] = 1;
          }
        });
        Object.keys(count).forEach( item => {
          let address = '0x' + item.substring(4);
            this.web3Provider.getRskProvider().eth.getBalance(address)
          .then(value => console.log(address + ' = ' + 
            this.web3Provider.getRskProvider().utils.fromWei(value, 'ether')));
        });
//        Object.keys(count).forEach( item => console.log(item + ' = '+ count[item]));
      });

//    this.web3Provider.getRskProvider().eth.getCode(
//      '0x0000000000000000000000000000000001000006',
//      (err, data) => { console.log('test'); console.log(data); });*/

    return this.allCurrenciesObs().flatMap(currencies => {
      if (currencies.length == 0) return Observable.of([]);
      return Observable.forkJoin(currencies.map(currency => {
        if (currency.contract == null) {
          return currency.balanceOf(account).map(balance => {
            let transactions = [];

            return <AccountToken>{
              currency: currency.symbol,
              image: currency.image,
              network: currency.network,
              name: currency.name,
              balance: balance.toString(),
              untilBlock: null,
              transactions: transactions,
              isCore: currency.isCore
            }
          });
        } else {
          return currency.balanceOf(account).map(balance => {
            let transactions = [];
            currency.contract.events.Transfer({
              fromBlock: 0,
              //   toBlock: null,
              topics: [null, this.web3Provider.encodeAddress(account.address), null]
            }).subscribe((error, data) => {
              if (data) {
                transactions.push(data);
              }
            });
            currency.contract.events.Transfer({
              fromBlock: 0,
              //   toBlock: null,
              topics: [null, null, this.web3Provider.encodeAddress(account.address)]
            }).subscribe((error, data) => {
              if (data) {
                transactions.push(data);
              }
            });
            return <AccountToken>{
              currency: currency.symbol,
              image: currency.image,
              name: currency.name,
              network: currency.network,
              balance: balance + '',
              untilBlock: null,
              transactions: transactions,
              isCore: currency.isCore
            };
          });
        }
      }));
    });
  }

  private getCoreCurrency(web3, network, name, symbol, image): Promise<Currency> {
    return Promise.resolve({
      name: name, decimal: 18, network: network,
      address: null, contract: null, supply: null, symbol: symbol,
      image: image,
      isCore: true,
      balanceOf: (account: Account) => Observable.fromPromise(Promise.resolve(account)
        .then(account => web3.eth.getBalance(account.address)
          .then(balance =>
            web3.utils.fromWei(balance, 'ether')))),
      history: (account: Account, start = 0) =>
        this.explorerProvider.findCoreTransactions(web3, network, account, start),
      transfer: (sender: Account, password: string,
        beneficiaryAddress: string, amount: number) => {
        let value = web3.utils.toWei(amount, 'ether');
        return this.accountProvider.getPrivateKey(sender, password).flatMap(privateKey => {
          return this.web3Provider.sendSignedTransaction(web3,
            sender.address, privateKey, beneficiaryAddress, value, null);
          });
      }
    });
  }

  private getDirectory(network, web3, directoryAddress): Promise<Currency>[] {
    let directory = new web3.eth.Contract(MtPelerinTokens.abi, directoryAddress);
    return directory.methods.getCurrencyCount().call().then(count => {
      let tokens = [];
      for (var i = 1; i <= count; i++) {
        let token: Promise<Currency> = directory.methods.getCurrencyById(i).call().then(address => {
          let contract = new web3.eth.Contract(FiatToken.abi, address);
          if (contract) {
            let methods = contract.methods;
            return Promise.all([
              methods.name().call(),
              methods.symbol().call()
                .then(symbol => web3.utils.toAscii(symbol)),
              methods.totalSupply().call(),
            ]).then(details => <Currency>{
              name: details[0],
              decimal: 2,
              network: network,
              address: address,
              contract: contract,
              supply: details[2],
              symbol: details[1],
              isCore: false,
              image: 'assets/imgs/currencies/MTPELERIN.svg',
              balanceOf: function (account: Account) {
                return Observable.fromPromise(Promise.resolve(account)
                  .then(account => this.contract.methods.balanceOf(account.address).call()
                      .then(balance => balance / 10 ** this.decimal)
                  ));
              },
              history: function (account: Account, start: number) { },
              transfer: function (sender: Account, password: string, beneficiaryAddress: string, amount: number) {
                console.log(amount + ' ' + this.symbol + ' to ' + beneficiaryAddress);
                let cents = amount * (10 ** this.decimal);
                let contractData = methods.transfer(beneficiaryAddress, cents).encodeABI();
                return this.accountProvider.getPrivateKey(sender, password).flatMap(privateKey =>
                  web3.sendSignedTransaction(web3,
                    sender.address, privateKey, address, null, contractData));
              }
            });
          } else {
            return null;
          }
        });
        tokens.push(token);
      }
      return tokens;
    });
  }

  public allCurrenciesObs(): Observable<Array<Currency>> {
    let rskDirectories = this.profileProvider.getProfile().tokens['RSK'];
    let ethDirectories = this.profileProvider.getProfile().tokens['ETH'];

    let currenciesPromises = Promise.all([]
      .concat(ethDirectories.map(directory =>
        this.getDirectory('ETH', this.web3Provider.getEthProvider(), directory)))
      .concat(rskDirectories.map(directory =>
        this.getDirectory('RSK', this.web3Provider.getRskProvider(), directory)))
    ).then(data => {
      let tokens = [
        this.getCoreCurrency(this.web3Provider.getRskProvider(),
          'RSK', 'SmartBTC', 'SBTC', 'assets/imgs/currencies/RSK.png'),
        this.getCoreCurrency(this.web3Provider.getEthProvider(),
          'ETH', 'Ethereum', 'ETH', 'assets/imgs/currencies/ETHER.svg')
      ];

      if (data[0]) {
        tokens = tokens.concat(data[0]);
      }
      if (data[1]) {
        tokens = tokens.concat(data[1])
      }

      return Promise.all(tokens);
    });

    currenciesPromises.then(currencies => {
      this.currencies = currencies;
    })

    return Observable.fromPromise(currenciesPromises);
  }
}
