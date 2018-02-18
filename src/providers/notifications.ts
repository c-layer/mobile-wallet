import { Injectable } from '@angular/core';
import { Web3Provider } from './web3';

@Injectable()
export class NotificationsProvider {
    blockNumber: number;
    newBlockTimeout: number = 0;

    constructor(private web3Provider: Web3Provider) {
    }

    getBlockNumber(): number {
        return this.blockNumber;
    }

    hasNewBlock(): boolean {
        return this.newBlockTimeout != 0;
    }

    start() {    }
}