import { Component, Input } from '@angular/core';
import { NotificationsProvider } from '../../providers/notifications';

@Component({
  selector: 'header',
  templateUrl: 'header.html'
})
export class HeaderComponent {
  @Input('colorAttr') colorAttr: string; //= "primary-dark";

  //public createdTxs = 0;
  //public pendingTxs = 0;
  //public unconfirmedTxs = 0;

  constructor(public notificationsProvider: NotificationsProvider) {
    //    this.web3Provider
    /* this.web3Provider.txsData().map(data => {
       let transactions = data.transactions;
 
       this.createdTxs = transactions.filter(tx => { return tx.status == 'CREATED'; }).length;
       this.pendingTxs = transactions.filter(tx => { return tx.status == 'PENDING'; }).length;
       this.unconfirmedTxs = transactions.filter(tx => { return tx.status == 'UNCONFIRMED'; }).length;
       let completedTxs = transactions.filter(tx => { return tx.status == 'COMPLETED'; }).length;
       console.log('all:' + transactions.length + ', created:' + this.createdTxs + ', pending:' +
         this.pendingTxs + ', unconfirmed:' + this.unconfirmedTxs
         + ', completed:' + completedTxs);
     }).subscribe();*/
  }
}
