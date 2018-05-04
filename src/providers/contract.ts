import { Injectable } from '@angular/core';
import { Web3Provider } from './web3';
import { Observable } from 'rxjs/Observable';
import { ProfileProvider } from './profile';
import { NetworkProvider } from './network';
import { Account } from '../model/account';
import { ContractType, Contract } from '../model/contract';

@Injectable()
export class ContractProvider {

    constructor(private web3Provider: Web3Provider,
        private networkProvider: NetworkProvider,
        private profileProvider: ProfileProvider) {
    }

    public canVote(contract: Contract, account: Account) {
        let web3 = this.web3Provider.getEthProvider();
        let shareContract = new web3.eth.Contract(ContractType.getDemoShare().abi, contract.address);

        return Observable.fromPromise(shareContract.methods.hasVoted(account.address).then(hasVoted => {
            let vote = contract.vote;
            let now = new Date().getTime();
            return (vote.closedAt > now ) && !hasVoted;
        }));
    }

    public sharesOwned(contract: Contract, account: Account) {
        let web3 = this.web3Provider.getEthProvider();
        let voteToken = new web3.eth.Contract(ContractType.getDemoShare().abi, contract.vote.voteToken);

        return Observable.fromPromise(voteToken.methods.balanceOf(account.address));
    }

    public contractsObs(account: Account): Observable<Contract[]> {
        let profile = this.profileProvider.getProfile();
        let activeNetworks = this.networkProvider.getActiveNetworks();
        let registriesConfig = profile.contracts[activeNetworks.code];
        let web3 = this.web3Provider.getEthProvider();

        let registryPromises = [];
        if (this.web3Provider.getEthProvider()) {
            let registries = registriesConfig['ETH'];
            registryPromises = registries.map(registryConfig => {
                let registry = new web3.eth.Contract(ContractType.getRegistry().abi, registryConfig.address);
                let registryContracts = []
                if (registry) {
                    for (let i = 0; i < registryConfig.types.length; i++) {
                        if (registryConfig.types[i] == 2) {
                            let contract: Promise<Contract> = registry.methods.addressById(i).call().then(address => {
                                let contract = new web3.eth.Contract(ContractType.getDemoShare().abi, address);
                                if (contract) {
                                    let methods = contract.methods;

                                    let voteTokenAddressPromise = methods.token().call();
                                    let voteTokenPromise = voteTokenAddressPromise.then((address) => {
                                        return new web3.eth.Contract(ContractType.getDemoToken().abi, address);
                                    });
                                    let voteTotalSupplyPromise = voteTokenPromise.then(voteToken => {
                                        return voteToken.methods.totalSupply().call();
                                    })
                                    let voteNamePromise = voteTokenPromise.then(voteToken => {
                                        return voteToken.methods.name().call();
                                    })
                                    let voteSymbolPromise = voteTokenPromise.then(voteToken => {
                                        return voteToken.methods.symbol().call();
                                    })
                                    let voteTokenOwnedPromise = voteTokenPromise.then(voteToken => {
                                        return voteToken.methods.balanceOf(account.address).call();
                                    })
                                    let voteTokenDecimalsPromise = voteTokenPromise.then(voteToken => {
                                        if(voteToken) {
                                            return voteToken.methods.decimals().call();
                                        }
                                        return 1;
                                    })

                                    let dividendTokenAddressPromise = methods.currentDividendToken().call();
                                    let dividendTokenPromise = dividendTokenAddressPromise.then((address) => {
                                        if (address != 0) {
                                            return new web3.eth.Contract(ContractType.getDemoToken().abi, address);
                                        }
                                        return undefined;
                                    });
                                    let dividendAmountPromise = dividendTokenPromise.then((dividendToken) => {
                                        if (dividendToken) {
                                            return dividendToken.methods.balanceOf(address).call();
                                        }
                                        return 0;
                                    })
                                    let dividendSymbolPromise = dividendTokenPromise.then((dividendToken) => {
                                        if (dividendToken) {
                                            return dividendToken.methods.symbol().call();
                                        }
                                        return '';
                                    })
                                    let dividendDecimalsPromise = dividendTokenPromise.then((dividendToken) => {
                                        if (dividendToken) {
                                            return dividendToken.methods.decimals().call();
                                        }
                                        return 1;
                                    })

                                    let promises = [
                                        voteTokenAddressPromise,
                                        voteTotalSupplyPromise,
                                        voteTokenOwnedPromise,
                                        voteNamePromise,
                                        voteSymbolPromise,
                                        dividendTokenAddressPromise,
                                        methods.currentProposalId().call(),
                                        methods.currentUrl().call(),
                                        methods.currentHash().call(),
                                        dividendAmountPromise,
                                        dividendSymbolPromise,
                                        methods.startedAt().call(),
                                        methods.closedAt().call(),
                                        methods.hasVoted(account.address).call(),//
                                        methods.voteApprovals().call(),
                                        methods.voteRejections().call(),
                                        dividendDecimalsPromise,
                                        voteTokenDecimalsPromise
                                    ];

                                    return Promise.all(promises).then(details => {
                                        let dividendAmount = Math.round(details[9] / (10**(details[16]-5)))/10**5;
                                        let voteTokenTotalSupply = Math.round(details[1] / (10**(details[17]-5)))/10**5;
                                        let voteTokenOwned = Math.round(details[2] / (10**(details[17]-5)))/10**5;
                                        contract = <Contract>{
                                            name: details[3] + ' shares',
                                            address: address,
                                            share: {
                                                dividendToken: details[5],
                                                dividendAmount: dividendAmount,
                                                dividendSymbol: details[10],
                                            },
                                            vote: {
                                                voteToken: details[0],
                                                voteTokenTotalSupply: voteTokenTotalSupply,
                                                voteTokenOwned: voteTokenOwned,
                                                voteTokenName: details[3],
                                                voteTokenSymbol: details[4],
                                                proposalId: details[6],
                                                url: details[7],
                                                hash: details[8],
                                                startedAt: details[11] * 1000,
                                                closedAt: details[12] * 1000,
                                                hasVoted: details[13],
                                                approvals: details[14],
                                                rejections: details[15]
                                            }
                                        }
                                        return contract;
                                    });
                                }
                            }).catch(error => {
                                console.log(error);
                            });

                            if (contract) {
                                registryContracts.push(contract);
                            }
                        }
                    }
                }
                return registryContracts;
            });

        }
        return Observable.fromPromise(Promise.all(registryPromises).then(data => {
            let contracts = [];
            for (let i = 0; i < data.length; i++) {
                if (data[i]) {
                    contracts = contracts.concat(data[i]);
                }
            }
            return Promise.all(contracts);
        }));
    }
}