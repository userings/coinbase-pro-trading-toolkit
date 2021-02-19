"use strict";
/***************************************************************************************************************************
 * @license                                                                                                                *
 * Copyright 2017 Coinbase, Inc.                                                                                           *
 *                                                                                                                         *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance          *
 * with the License. You may obtain a copy of the License at                                                               *
 *                                                                                                                         *
 * http://www.apache.org/licenses/LICENSE-2.0                                                                              *
 *                                                                                                                         *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on     *
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the                      *
 * License for the specific language governing permissions and limitations under the License.                              *
 ***************************************************************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const coinbaseProFactories_1 = require("../factories/coinbaseProFactories");
const Logger_1 = require("../utils/Logger");
program
    .option('--api [value]', 'API url', 'https://api.pro.coinbase.com')
    .option('--ws [value]', 'WSI url', 'https://ws-feed.pro.coinbase.com')
    .option('-p --product [value]', 'The Coinbase Pro product to query', 'BTC-USD')
    .parse(process.argv);
const wsURL = program.ws;
const apiURL = program.api;
const product = program.product;
const logger = Logger_1.ConsoleLoggerFactory();
const key = program.key || process.env.COINBASE_PRO_KEY;
const auth = key ? {
    key: key,
    secret: program.secret || process.env.COINBASE_PRO_SECRET,
    passphrase: program.passphrase || process.env.COINBASE_PRO_PASSPHRASE
} : null;
const options = {
    wsUrl: wsURL,
    apiUrl: apiURL,
    channels: ['level2', 'matches', 'user', 'ticker'],
    auth: auth,
    logger: logger
};
coinbaseProFactories_1.getSubscribedFeeds(options, [product]).then((feed) => {
    feed.on('data', (msg) => {
        logger.log('info', JSON.stringify(msg));
    });
}).catch((err) => {
    logger.log('error', err.message);
    process.exit(1);
});
//# sourceMappingURL=wsFeedDump.js.map