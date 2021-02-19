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
const CoinbaseProFeed_1 = require("../exchanges/coinbasePro/CoinbaseProFeed");
const CoinbaseProExchangeAPI_1 = require("../exchanges/coinbasePro/CoinbaseProExchangeAPI");
const ExchangeFeed_1 = require("../exchanges/ExchangeFeed");
let publicAPIInstance;
function getAuthFromEnv() {
    const env = process.env;
    if (env.COINBASE_PRO_KEY && env.COINBASE_PRO_SECRET && env.COINBASE_PRO_PASSPHRASE) {
        return {
            key: env.COINBASE_PRO_KEY,
            secret: env.COINBASE_PRO_SECRET,
            passphrase: env.COINBASE_PRO_PASSPHRASE
        };
    }
    else {
        return null;
    }
}
/**
 * A convenience function that returns a CoinbaseProExchangeAPI instance for accessing REST methods conveniently. If API
 * key details are found in the COINBASE_PRO_KEY etc. envars, they will be used
 */
function DefaultAPI(logger) {
    if (!publicAPIInstance) {
        publicAPIInstance = new CoinbaseProExchangeAPI_1.CoinbaseProExchangeAPI({
            logger: logger,
            apiUrl: CoinbaseProExchangeAPI_1.COINBASE_PRO_API_URL,
            auth: getAuthFromEnv()
        });
    }
    return publicAPIInstance;
}
exports.DefaultAPI = DefaultAPI;
/**
 * Convenience function to connect to and subscribe to the given channels
 * @param options {object} Any options from CoinbaseProConfig will be accepted
 * @param products {string[]} An array of products to subscribe to
 */
function getSubscribedFeeds(options, products) {
    const config = {
        wsUrl: options.wsUrl || CoinbaseProFeed_1.COINBASE_PRO_WS_FEED,
        auth: options.auth,
        logger: options.logger,
        apiUrl: options.apiUrl || CoinbaseProExchangeAPI_1.COINBASE_PRO_API_URL,
        channels: options.channels || null
    };
    const feed = ExchangeFeed_1.getFeed(CoinbaseProFeed_1.CoinbaseProFeed, config);
    if (feed.isConnected()) {
        return feed.subscribe(products).then(() => {
            return feed;
        });
    }
    return new Promise((resolve) => {
        if (!feed.isConnecting) {
            feed.reconnect(50);
        }
        feed.once('websocket-open', () => {
            feed.subscribe(products).then(() => {
                return resolve(feed);
            });
        });
    });
}
exports.getSubscribedFeeds = getSubscribedFeeds;
/**
 * This is a straightforward wrapper around getSubscribedFeeds using the Factory pattern with the most commonly used
 * defaults. For customised feeds, use getSubscribedFeeds instead.
 *
 * It is assumed that your API keys are stored in the COINBASE_PRO_KEY, COINBASE_PRO_SECRET and COINBASE_PRO_PASSPHRASE envars
 */
function FeedFactory(logger, productIDs, auth) {
    auth = auth || getAuthFromEnv();
    // Use the Coinbase Pro API to get, and subscribe to all the endpoints
    let productPromise;
    if (productIDs) {
        productPromise = Promise.resolve(productIDs);
    }
    else {
        productPromise = DefaultAPI(logger)
            .loadProducts()
            .then((products) => {
            const ids = products.map((p) => p.id);
            return ids;
        });
    }
    return productPromise.then((productIds) => {
        return getSubscribedFeeds({ auth: auth, logger: logger }, productIds);
    }).catch((err) => {
        if (logger) {
            logger.error(err);
        }
        else {
            console.error(err);
        }
        return null;
    });
}
exports.FeedFactory = FeedFactory;
//# sourceMappingURL=coinbaseProFactories.js.map