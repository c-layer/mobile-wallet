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
import { NetworkProvider } from './network';

@Injectable()
export class CurrencyProvider {
  public currencies: Currency[] = [];

  constructor(private web3Provider: Web3Provider,
    private networkProvider: NetworkProvider,
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

  public getCurrencyByAddress(address: string) {
    let result = null;
    if (address) {
      this.currencies.forEach(currency => {
        if (currency.address == address) {
          result = currency;
        }
      })
    }
    return result;
  }

  public portfolioObs(account: Account): Observable<AccountToken[]> {
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

            if (currency.network == 'RSK' && currency.symbol == 'GBP') {
            }

            if (currency.network == 'ETH') {
              currency.contract.events.Transfer({
                fromBlock: 0,
                //   toBlock: null,
                topics: [null, this.web3Provider.encodeAddress(account.address), null]
              }).subscribe((error, data) => {
                if (error) {
                  console.error(error);
                } else if (data) {
                  transactions.push(data);
                }
              });
              currency.contract.events.Transfer({
                fromBlock: 0,
                //   toBlock: null,
                topics: [null, null, this.web3Provider.encodeAddress(account.address)]
              }).subscribe((error, data) => {
                if (error) {
                  console.error(error);
                } else if (data) {
                  transactions.push(data);
                }
              });
            }
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
      },
      estimateTransfer: (sender: Account, beneficiaryAddress: string, amount: number) => {
        let value = web3.utils.toWei(amount, 'ether');
        return Observable.fromPromise(web3.eth.estimateGas({ from: sender.address, to: beneficiaryAddress, value }));
      },
      getGasPrice: () => {
        return Observable.fromPromise(web3.eth.getGasPrice());
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
            let decimal = 2;
            return Promise.all([
              methods.name().call(),
              methods.symbol().call()
                .then(symbol => web3.utils.toAscii(symbol)),
              methods.totalSupply().call(),
            ]).then(details => <Currency>{
              name: details[0],
              decimal: decimal,
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
              transfer: (sender: Account, password: string, beneficiaryAddress: string,
                amount: number) => {
                console.log(amount + ' ' + details[1] + ' to ' + beneficiaryAddress);
                let cents = amount * (10 ** decimal);
                let contractData = methods.transfer(beneficiaryAddress, cents).encodeABI();
                return this.accountProvider.getPrivateKey(sender, password)
                  .flatMap(privateKey =>
                    this.web3Provider.sendSignedTransaction(web3,
                      sender.address, privateKey, address, null, contractData));
              },
              estimateTransfer: (sender: Account, beneficiaryAddress: string, amount: number) => {
                let cents = amount * (10 ** decimal);
                return Observable.fromPromise(methods.transfer(beneficiaryAddress, cents).estimateGas(
                  { from: sender.address, to: beneficiaryAddress, value: 0 }
                ));
              },
              getGasPrice: () => {
                return Observable.fromPromise(web3.eth.getGasPrice());
              }
            });
          } else {
            return null;
          }
        }).catch(error => {
          console.error(error);
        });
        tokens.push(token);
      }
      return tokens;
    }).catch(error => {
      console.error(error);
    });
  }

  public allCurrenciesObs(): Observable<Array<Currency>> {

    let directoryPromises = [];
    let tokens = [];
    let profile = this.profileProvider.getProfile();

    let activeNetworks = this.networkProvider.getActiveNetworks();
    let contracts = profile.contracts[activeNetworks.code];

    if (this.web3Provider.getEthProvider()) {
      if (contracts['ETH']) {
        let ethDirectories = contracts['ETH']
          .filter(contract => contract.directory)
          .map(contract => contract.address);
        directoryPromises = directoryPromises.concat(ethDirectories.map(directory =>
          this.getDirectory('ETH', this.web3Provider.getEthProvider(), directory)));
      }

      tokens = tokens.concat(this.getCoreCurrency(this.web3Provider.getEthProvider(),
        'ETH', 'Ethereum', 'ETH', 'assets/imgs/currencies/ETHER.svg'));
    }

    if (this.web3Provider.getRskProvider()) {
      if (contracts['RSK']) {
        let rskDirectories = contracts['RSK']
          .filter(contract => contract.directory)
          .map(contract => contract.address);
        directoryPromises = directoryPromises.concat(rskDirectories.map(directory =>
          this.getDirectory('RSK', this.web3Provider.getRskProvider(), directory)));
      }

      tokens = tokens.concat(
        this.getCoreCurrency(this.web3Provider.getRskProvider(),
          'RSK', 'SmartBTC', 'SBTC', 'assets/imgs/currencies/RSK.png'));
    }

    let currenciesPromises = Promise.all(directoryPromises).then(data => {
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
    });

    return Observable.fromPromise(currenciesPromises);
  }
}
