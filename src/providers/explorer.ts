import { Injectable } from '@angular/core';
import { Account } from '../model/account';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ExplorerProvider {

    constructor() { }

    private loadTxFromBlock(web3, blockId, address, diffBalance, result, resultValue) {
        web3.eth.getBlock(blockId).then(block => {
            let promises = [];
            for (let i = 0; i < block.transactions.length; i++) {
                promises.push(web3.eth.getTransactionFromBlock(blockId, i)
                    .catch(error => {
                        // Probably 0x00 is not an Ethereum Address in RSK
                        // console.log(error + '('+block.transactions[i]+')');
                        return null;
                    }));
            }
            return Promise.all(promises).then(txs =>
                txs.filter(tx => tx != null).map(tx => {
                    tx.timestamp = block.timestamp;
                    return tx;
                })
            );
        }).then(txs => {
            let filteredTxs = txs.filter(tx => (tx && (tx.from == address || tx.to == address)));

            let remainingBalance = diffBalance;
            filteredTxs.forEach(tx => {
                if (tx.from == address) {
                    remainingBalance -= tx.amount;
                }
                if (tx.to == address) {
                    remainingBalance += tx.amount;
                }
                resultValue.transactions.push(tx);
            })

            if (remainingBalance > 0) {
                let tx = {
                    blockNumber: blockId,
                    from: '0x0000000000000000000000000000000001000006',
                    to: address,
                    value: '' + remainingBalance,
                    timestamp: txs[0].timestamp,
                    gas: 0,
                    gasPrice: 0
                }
                resultValue.transactions.push(tx);
            }
            resultValue.completion++;
            result.next(resultValue);
        }).catch(err => {
            console.log(web3.currentProvider);
            console.error('For block ' + blockId + ': ', err);
            resultValue.completion++;
            resultValue.errors++;
            result.next(resultValue);
        });
    }

    private exploration(web3, account, result, resultValue,
        start, end, fTxCountStart, fTxCountEnd, fTxBalanceStart, fTxBalanceEnd) {
        if(resultValue.errors > 0) {
            return;
        }

        if ((end - start) == 1) {
            this.loadTxFromBlock(web3, end, account.address,
                fTxBalanceEnd - fTxBalanceStart, result, resultValue);
            return;
        }

        let split = Math.round((end + start) / 2);

        Promise.all([
            web3.eth.getTransactionCount(account.address, split),
            web3.eth.getBalance(account.address, split)
        ]).then(data => {
            let fTxCountSplit = data[0];
            let fTxBalanceSplit = data[1];

            if ((fTxCountSplit - fTxCountStart) != 0 || (fTxBalanceSplit - fTxBalanceStart) != 0) {
                this.exploration(web3, account, result, resultValue,
                    start, split, fTxCountStart, fTxCountSplit, fTxBalanceStart, fTxBalanceSplit);
            } else {
                resultValue.completion += (split - start);
                result.next(resultValue);
            }

            if ((fTxCountEnd - fTxCountSplit) != 0 || (fTxBalanceEnd - fTxBalanceSplit) != 0) {
                this.exploration(web3, account, result, resultValue,
                    split, end, fTxCountSplit, fTxCountEnd, fTxBalanceSplit, fTxBalanceEnd);
            } else {
                resultValue.completion += (end - split);
                result.next(resultValue);
            }
        }).catch(err => {
            console.log('exploration['+account.name+', '+resultValue.network+', '
                +start+', '+end+', '+fTxCountStart+', '+fTxCountEnd+', '
                +fTxBalanceStart+', '+fTxBalanceEnd+']');
            console.log(err);
            resultValue.errors++;
            result.next(resultValue);
        });
    }

    public findCoreTransactions(web3, network, account: Account, start = 0) {
        let resultValue = {
            network: network,
            startTime: new Date().getTime(),
            block: null,
            transactions: [],
            completion: 0,
            errors: 0
        };
        let result = new BehaviorSubject(resultValue);
        let initPromises = [
            web3.eth.getBlockNumber(),
            web3.eth.getTransactionCount(account.address),
            web3.eth.getBalance(account.address),
        ];
        if (start > 0) {
            initPromises.push(web3.eth.getTransactionCount(account.address, start));
            initPromises.push(web3.eth.getBalance(account.address, start));
        }

        Promise.all(initPromises).then(data => {
            let block = data[0];
            let txCount = data[1];
            let txBalance = data[2];

            let txCountAtStart = 0;
            let txBalanceAtStart = 0;
            if (start > 0) {
                txCountAtStart = data[3];
                txBalanceAtStart = data[4];
            }

            resultValue.block = block - start;

            if ((txCount - txCountAtStart > 0 || txBalance - txBalanceAtStart != 0) && start < block) {
                this.exploration(web3, account, result, resultValue,
                    start, block, txCountAtStart, txCount, txBalanceAtStart, txBalance);
            } else {
                resultValue.completion = block - start;
                result.next(resultValue);
            }
        }).catch(err => {
            console.error(err);
            resultValue.errors++;
            result.next(resultValue);
        });

        console.log('Starting Exploring ' + network + ' Blockchain for ' + account.address + '...');
        result.subscribe(value => {
            let completion = 0;
            if (value.block) {
                completion = Math.floor(value.completion
                    / value.block * 10000) / 100;
            }
            if (value.completion == value.block) {
                let time = (new Date()).getTime() - value.startTime;
                console.log('Completion: ' + completion + '%, '
                    + 'explored: ' + value.completion + ' and '
                    + 'found: ' + value.transactions.length + ', '
                    + 'in ' + time + ' ms');
            }
        })

        return result;
    }
}