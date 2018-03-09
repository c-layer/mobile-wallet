import { Injectable } from '@angular/core';

@Injectable()
export class NotificationsProvider {
    blockNumber: number;
    newBlockTimeout: number = 0;

    constructor() {
        
        /*this.platform.ready().then(() => {
            console.log(this.platform.platforms());
            
            // Android customization
            this.backgroundMode.setDefaults({ text: 'Doing heavy tasks.' });
            // Enable background mode
            this.backgroundMode.enable();

            console.log('device ready !');
            this.backgroundMode.on('activate').subscribe(() => {
                setTimeout(() => {
                    // Modify the currently displayed notification
                    backgroundMode.configure({
                        text:'Running in background for more than 5s now.'
                    });
                }, 5000);
            });
        });*/
    }

    getBlockNumber(): number {
        return this.blockNumber;
    }

    hasNewBlock(): boolean {
        return this.newBlockTimeout != 0;
    }

    start() { }
}