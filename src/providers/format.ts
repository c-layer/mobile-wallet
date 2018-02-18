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

    formatDate(timestamp: number) {
        if(timestamp==null || timestamp==undefined) return;

        let date = new Date(timestamp);

        let digits2 = (i: number) => i < 10 ? "0" + i : i;

        return date.getFullYear() + '-' + digits2(date.getMonth()) + '-' + digits2(date.getDay())
            + ' ' + digits2(date.getHours())
            + ':' + digits2(date.getMinutes())
            + ':' + digits2(date.getSeconds());
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