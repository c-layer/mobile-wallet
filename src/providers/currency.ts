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

  public portfolioObs(account: Account): Observable<AccountToken[]> {
    return this.allCurrenciesObs().flatMap(currencies => {
      if (currencies.length == 0) return Observable.of([]);
      return Observable.forkJoin(currencies.map(currency => {
        if (currency.contract == null) {
          return Observable.forkJoin([currency.balanceOf(account),
          currency.history(account)]).map(data => {
            let balance = data[0].toString();
            let transactions: any = data[1];

            return <AccountToken>{
              currency: currency.symbol,
              image: currency.image,
              network: null,
              name: currency.name,
              balance: balance,
              untilBlock: null,
              transactions: transactions
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
              balance: balance,
              untilBlock: null,
              transactions: transactions
            };
          });
        }
      }));
    });
  }

  private getCoreCurrency(web3, name, symbol, image): Promise<Currency> {
    return Promise.resolve({
      name: name, decimal: null, network: null,
      address: null, contract: null, supply: null, symbol: symbol,
      image: image,
      balanceOf: (account: Account) => Observable.fromPromise(Promise.resolve(account)
        .then(account => web3.eth.getBalance(account.address)
          .then(balance => web3.utils.fromWei(balance, 'ether')))),
      history: (account: Account) => this.explorerProvider.findCoreTransactions(web3, account),
      transfer: function (sender: Account, password: string,
        beneficiaryAddress: string, amount: number) {
        let value = this.web3Provider.getUtils().toWei(amount, 'ether');
        let result = this.accountProvider.getPrivateKey(sender, password).flatMap(privateKey =>
          this.web3Provider.sendSignedTransaction(web3,
            sender.address, privateKey, beneficiaryAddress, value, null));
        let eth = sender.portfolio[0];
        eth.transactions.push({
          returnValues: {
            value: value, from: sender.address, to: beneficiaryAddress
          }
        });
        return result;
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
              image: 'assets/imgs/currencies/MTPELERIN.svg',
              balanceOf: function (account: Account) {
                return Observable.fromPromise(Promise.resolve(account)
                  .then(account => {
                    const Web3 = require("web3");
                    let web3 = new Web3(this.contract._provider);
                    this.contract.methods.balanceOf(account.address).call();
                    return this.contract.methods.balanceOf(account.address).call();
                  })
                  .then((balance: number) => {
                    return ((balance) ? balance / 100 : 0) + '';
                  }))
              },
              history: function (account: Account) { },
              transfer: function (sender: Account, password: string, beneficiaryAddress: string, amount: number) {
                console.log(amount + ' ' + this.symbol + ' to ' + beneficiaryAddress);
                let cents = amount * (10 ** this.decimal);
                let contractData = methods.transfer(beneficiaryAddress, cents).encodeABI();
                return this.accountProvider.getPrivateKey(sender, password).flatMap(privateKey =>
                  this.web3Provider.sendSignedTransaction(web3,
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
          'SmartBTC', 'SBTC', 'assets/imgs/currencies/RSK.png'),
        this.getCoreCurrency(this.web3Provider.getEthProvider(),
          'Ethereum', 'ETH', 'assets/imgs/currencies/ETHER.svg')
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
