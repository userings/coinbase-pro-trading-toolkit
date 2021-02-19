#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const CoinbaseProExchangeAPI_1 = require("../exchanges/coinbasePro/CoinbaseProExchangeAPI");
const printers_1 = require("../utils/printers");
const types_1 = require("../lib/types");
program
    .option('--api [value]', 'API url')
    .option('-p --product [value]', 'The Coinbase Pro product to query')
    .option('-t --ticker', 'Fetch ticker')
    .option('-N --newMarketOrder [side,size]', 'Place a new market order')
    .option('-L --newLimitOrder [side,size,price]', 'Place a new limit order')
    .option('-B --balances', 'Retrieve all account balances')
    .option('-O --orders', 'Retrieve all my open orders (if product is provided, limited to that book)')
    .option('-x --cancelAllOrders', 'Cancel all open orders (if product is provided, limited to that book)')
    .option('-W --crypto_withdraw [amount,cur,address]', 'Withdraw to a crypto address')
    .option('--transfer [type,amount,cur]', 'deposit or withdraw from/to coinbase')
    .option('-X --method [method]', 'method for general request')
    .option('-U --url [url]', 'request url')
    .option('-P --body [body]', 'request body')
    .parse(process.argv);
const auth = {
    key: process.env.COINBASE_PRO_KEY,
    secret: process.env.COINBASE_PRO_SECRET,
    passphrase: process.env.COINBASE_PRO_PASSPHRASE
};
const coinbaseProConfig = {
    logger: null,
    apiUrl: program.api || process.env.API_URL || 'https://api.pro.coinbase.com'
};
if (auth.key && auth.secret && auth.passphrase) {
    coinbaseProConfig.auth = auth;
}
const coinbaseProApi = new CoinbaseProExchangeAPI_1.CoinbaseProExchangeAPI(coinbaseProConfig);
if (program.url) {
    const method = program.method || 'GET';
    const body = program.body || '';
    makeGenericRequest(method, program.url, body).then((json) => {
        console.log(json);
        process.exit(0);
    });
}
function hasAuth() {
    if (coinbaseProConfig.auth) {
        return true;
    }
    console.log('No authentication credentials were supplied, so cannot fulfil request');
    return false;
}
function logError(err) {
    console.error(printers_1.printSeparator());
    console.error('Error: ' + err.message);
    if (err && (err.response && err.response.error)) {
        console.error(err.response.error.message);
    }
    console.error(printers_1.printSeparator());
}
function requiredOptions(options) {
    let valid = true;
    options.forEach((opt) => {
        if (!program[opt]) {
            console.log(`${opt} is a required option`);
            valid = false;
        }
    });
    return valid;
}
function makeGenericRequest(method, url, body) {
    const opts = {
        body: body,
        qs: null,
        headers: null
    };
    return coinbaseProApi.authCall(method, url, opts).then((res) => {
        return res.body;
    }).catch((res) => {
        const err = res.response.error || res.response.body;
        return { error: err.text || err.json || err };
    });
}
if (program.ticker) {
    if (!requiredOptions(['product'])) {
        process.exit(1);
    }
    coinbaseProApi.loadTicker(program.product).then((ticker) => {
        console.log(printers_1.printSeparator());
        console.log(`Ticker for ${program.product} on Coinbase Pro`);
        console.log(printers_1.printTicker(ticker));
        console.log(printers_1.printSeparator());
    }).catch(logError);
}
if (program.transfer) {
    const [type, amount, currency] = program.transfer.split(',');
    const isDeposit = type.toLowerCase().startsWith('dep');
    const params = {
        amount: types_1.Big(amount),
        currency: currency,
        walletIdFrom: isDeposit ? 'coinbase' : 'coinbase-pro',
        walletIdTo: isDeposit ? 'coinbase-pro' : 'coinbase'
    };
    coinbaseProApi.requestTransfer(params).then((result) => {
        console.log('Transfer successful: ', result.success);
        console.log('Details: ', result.details);
    }).catch(logError);
}
if (program.newMarketOrder && hasAuth()) {
    if (!requiredOptions(['product'])) {
        process.exit(1);
    }
    const vals = program.newMarketOrder.split(',');
    const params = {
        type: 'placeOrder',
        time: new Date(),
        clientId: null,
        side: vals[0],
        size: vals[1],
        productId: program.product,
        price: null,
        orderType: 'market'
    };
    const msg = `Market ${params.side} order for ${params.size}`;
    coinbaseProApi.placeOrder(params).then((result) => {
        console.log(printers_1.printSeparator());
        console.log(msg);
        console.log(result);
    }).catch(logError);
}
if (program.newLimitOrder && hasAuth()) {
    if (!requiredOptions(['product'])) {
        process.exit(1);
    }
    const [side, size, price] = program.newLimitOrder.split(',');
    const params = {
        type: 'placeOrder',
        time: new Date(),
        clientId: null,
        side: side,
        size: size,
        productId: program.product,
        price: price,
        orderType: 'limit'
    };
    const msg = `Limit ${params.side} order for ${params.size} at ${params.price}`;
    coinbaseProApi.placeOrder(params).then((result) => {
        console.log(printers_1.printSeparator());
        console.log(msg);
        console.log(result);
    }).catch(logError);
}
if (program.balances && hasAuth()) {
    console.log('Retrieving account balances..');
    coinbaseProApi.loadBalances().then((balances) => {
        console.log(printers_1.printSeparator());
        for (const profile in balances) {
            const account = balances[profile];
            for (const cur in account) {
                const bal = account[cur];
                console.log(`Balances for ${cur} in ${profile}:`);
                console.log(`Available: ${printers_1.padfloat(bal.available, 8, 4)} ${cur}`);
                console.log(`Total:     ${printers_1.padfloat(bal.balance, 8, 4)} ${cur}\n`);
            }
        }
        console.log(printers_1.printSeparator());
    }).catch(logError);
}
if (program.orders && hasAuth()) {
    console.log('Retrieving open orders..');
    console.log(printers_1.printSeparator());
    coinbaseProApi.loadAllOrders(program.product).then((orders) => {
        console.log('Product-ID\tStatus   \tSide\tPrice     \tSize      \tTime of order     \tOrder-ID');
        orders.forEach((order) => {
            console.log(`${order.productId}\t${order.status}\t${order.side}\t${printers_1.padfloat(order.price, 8, 4)}\t${printers_1.padfloat(order.size, 8, 4)}\t${order.time.toString()}\t${order.id}`);
        });
        console.log(printers_1.printSeparator());
    }).catch(logError);
}
if (program.cancelAllOrders && hasAuth()) {
    console.log('Cancelling open orders..');
    console.log(printers_1.printSeparator());
    coinbaseProApi.cancelAllOrders(program.product).then((orders) => {
        orders.forEach((order) => {
            console.log(order);
        });
        console.log(printers_1.printSeparator());
    }).catch(logError);
}
//# sourceMappingURL=coinbaseProConsole.js.map