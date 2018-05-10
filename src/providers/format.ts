import { Injectable } from '@angular/core';
import { AccountProvider } from './account';
import { CurrencyProvider } from './currency';

@Injectable()
export class FormatProvider {

    constructor(private accountProvider: AccountProvider, private currencyProvider: CurrencyProvider) {}
    
    public formatAmount(value: number): string {
        if(value==null || value==undefined) return;

        let splitted: string[] = value.toString().split(".");
        let integerValue = (splitted.length > 0) ? splitted[0] : "--";
        let decimalValue = (splitted.length > 1) ? splitted[1] : "";

        if(decimalValue.length > 8) {
            decimalValue = decimalValue.substr(0, 10);
        }

        let result = ("" == decimalValue) ? "" : "." + decimalValue;
        result = integerValue.substr(
            Math.max(0, integerValue.length - 3), 3) + result;
        for (var i = integerValue.length - 3; i >= 0; i = i - 3) {
            if (i - 3 >= 0) {
                result = integerValue.substr(i - 3, 3) + "'" + result;
            } else if (i > 0) {
                result = integerValue.substr(0, i) + "'" + result;
            }
        }

        return result;
    }

    public formatDate(timestamp: number) {
        if(timestamp==null || timestamp==undefined) return;

        let date = new Date(timestamp);

        let digits2 = (i: number) => i < 10 ? "0" + i : i;

        return date.getFullYear() + '-' + digits2(date.getMonth()+1) + '-' + digits2(date.getDay()+1)
            + ' ' + digits2(date.getHours())
            + ':' + digits2(date.getMinutes())
            + ':' + digits2(date.getSeconds());
    }

    public formatTimeAgo(timestamp: number) {
        let now = new Date();
        let before = new Date(timestamp * 1000);
        let ago = new Date().getTime() - timestamp * 1000;

        let yearDiff = now.getFullYear() - before.getFullYear();
        if(yearDiff > 1) {
            return yearDiff+' years ago';
        }

        let monthDiff =  (12*yearDiff) + now.getMonth() - before.getMonth();
        if(monthDiff > 1) {
            return monthDiff+' months ago';
        }

        let dayDiff = (monthDiff*new Date(now.getFullYear(), now.getMonth()+1, 0).getDate())
             + now.getDay() - before.getDay();
        if(dayDiff > 1) {
            return dayDiff+' days ago';
        }

        let hourDiff = (dayDiff*24) + now.getHours() - before.getHours();
        if(hourDiff > 1) {
            return hourDiff+' hours ago';
        }
        let minuteDiff = (hourDiff*60) + now.getMinutes() - before.getMinutes();
        if(minuteDiff > 1) {
            return minuteDiff+' minutes ago';
        }
        let secondsDiff = (minuteDiff*60) + now.getSeconds() - before.getSeconds()
        if(secondsDiff > 1) {
            return secondsDiff+' seconds ago';
        }
        return ' a moment ago';
    }

    formatHexadecimal(value: string) {
        return '0x' + parseInt(value).toString(16);
    }

    formatAddress(address) {
        let name = address;

        if(name && name.startsWith('0x')) {
            name = this.accountProvider.getAccountName(address);
        }
        if(name == '0x0000000000000000000000000000000001000006') {
            name = 'Bitcoin-RSK bridge';
        }

        if(name && name.startsWith('0x')) {
            let currency = this.currencyProvider.getCurrencyByAddress(address);

            if(currency) {
                name = currency.name + ' ('+currency.network+') contract';
            }
        }

        if(name && name == address == name.startsWith('0x')
            && name.length > 40) {
            name = '0x' + name.substr(2, 4) + '...' + name.substr(name.length-4,4);
        }

        return name;
    }
}