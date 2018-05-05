
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
import { ContractType } from '../model/contract';

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
      return Observable.forkJoin(currencies.filter(currency => !!currency).map(currency => {
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
              isCore: currency.isCore,
              isKyc: false
            }
          });
        } else {
          let balanceObs = currency.balanceOf(account);
          let isKycObs = currency.isKyc(account);
          
          return Observable.zip(balanceObs, isKycObs, (balance, isKyc) => {
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
              isCore: currency.isCore,
              isKyc: isKyc
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
      isKyc: (account: Account) => Observable.of(false),
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

  private getRegistry(network, web3, directoryConfig): Promise<Currency>[] {
    let directory = new web3.eth.Contract(ContractType.getRegistry().abi, directoryConfig.address);

    return directory.methods.addressCount().call().then(count => {
      let tokens = [];
      for (let i=0; i < count; i++) {
        let type = (i < directoryConfig.types.length) ? directoryConfig.types[i] : 0;
        if ([0, 1].indexOf(type) == -1) { continue; }
        let token: Promise<Currency> = directory.methods.addressById(i).call().then(address => {
          let contract = new web3.eth.Contract(ContractType.getDemoToken().abi, address);
          if (contract) {
            let methods = contract.methods;
            let promises = [
              methods.name().call(),
              methods.symbol().call(),
              methods.totalSupply().call(),
              methods.decimals().call()
            ];
            
            return Promise.all(promises).then(details => <Currency>{
              name: details[0],
              decimal: details[3],
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
              isKyc: function( account: Account ) {
                let contractType = ContractType.getContractType(directoryConfig.types[i]);
                if(contractType.kyc) {
                  return Observable.fromPromise(Promise.resolve(account)
                    .then(account => this.contract.methods.isKYCValid(account.address).call().then(isKyc => {
                      return isKyc;
                    })));
                }
                return Observable.of(true);
              },
              history: function (account: Account, start: number) { },
              transfer: (sender: Account, password: string, beneficiaryAddress: string,
                amount: number) => {
                console.log(amount + ' ' + details[1] + ' to ' + beneficiaryAddress);
                let cents = amount * (10 ** details[3]);
                let contractData = methods.transfer(beneficiaryAddress, cents).encodeABI();
                return this.accountProvider.getPrivateKey(sender, password)
                  .flatMap(privateKey =>
                    this.web3Provider.sendSignedTransaction(web3,
                      sender.address, privateKey, address, null, contractData));
              },
              estimateTransfer: (sender: Account, beneficiaryAddress: string, amount: number) => {
                let cents = amount * (10 ** details[3]);
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
          console.log('Invalid address for id='+i + ' with directory='+directory._address);
          console.error(error);
        });
        if (token) {
          tokens.push(token);
        }
      }
      return tokens;
    }).catch(error => {
      console.error(error);
    });
  }

  public allCurrenciesObs(): Observable<Array<Currency>> {

    let directoryPromises = [];
    let tokens = [
      this.getCoreCurrency(this.web3Provider.getEthProvider(),
        'ETH', 'Ethereum', 'ETH', 'assets/imgs/currencies/ETHER.svg'),
        this.getCoreCurrency(this.web3Provider.getRskProvider(),
        'RSK', 'SmartBTC', 'SBTC', 'assets/imgs/currencies/RSK.png')
    ];
    let profile = this.profileProvider.getProfile();

    let activeNetworks = this.networkProvider.getActiveNetworks();
    let contracts = profile.contracts[activeNetworks.code];

    if (this.web3Provider.getEthProvider()) {
      if (contracts['ETH']) {
        directoryPromises = directoryPromises.concat(contracts['ETH'].map(directory =>
          this.getRegistry('ETH', this.web3Provider.getEthProvider(), directory)));
      }
    }

    if (this.web3Provider.getRskProvider()) {
      if (contracts['RSK']) {
        let rskDirectories = contracts['RSK']
          .filter(contract => contract.directory)
          .map(contract => contract.address);
          directoryPromises = directoryPromises.concat(contracts['RSK'].map(directory =>
            this.getRegistry('RSK', this.web3Provider.getEthProvider(), directory)));
        }

      tokens = tokens.concat(
        );
    }

    let currenciesPromises = Promise.all(directoryPromises).then(data => {
      for(let i = 0; i < data.length ; i++) {
        if (data[i]) {
          tokens = tokens.concat(data[i]);
        }
      }
      return Promise.all(tokens);
    });

    currenciesPromises.then(currencies => {
      this.currencies = currencies;
    });

    return Observable.fromPromise(currenciesPromises);
  }
}
