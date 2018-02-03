import { Injectable } from '@angular/core';
import { Web3Provider } from './web3';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class NotificationsProvider {
    blockNumber: number;
    newBlockTimeout: number = 0;

    blockDataSubscription: Subscription;

    constructor(private web3Provider: Web3Provider) {
    }

    getBlockNumber(): number {
        return this.blockNumber;
    }

    hasNewBlock(): boolean {
        return this.newBlockTimeout != 0;
    }

    start() {
        this.web3Provider.whenReady().map(() => {
            this.blockDataSubscription = this.web3Provider.blockData().map(block => {
                this.blockNumber = block.number;

                this.newBlockTimeout++;
                setTimeout(() => {
                    this.newBlockTimeout--;
                }, 3000);
            }).subscribe();
        }).subscribe();
    }
}