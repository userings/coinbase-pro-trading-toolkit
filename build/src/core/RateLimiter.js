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
const stream_1 = require("stream");
const limiter_1 = require("limiter");
/**
 * A simple transform stream that passes messages through at a specified rate. The timestamp is updated to reflect when
 * the message was actually sent
 */
class RateLimiter extends stream_1.Transform {
    /**
     * Limit outgoing message to `limit` per `interval`
     * @param limit The number of messages released per interval
     * @param interval The length of an interval in ms
     */
    constructor(limit, interval) {
        super({ readableObjectMode: true, writableObjectMode: true, highWaterMark: 4196 });
        this.limiter = new limiter_1.RateLimiter(limit, interval, false);
    }
    _transform(msg, _encoding, callback) {
        this.limiter.removeTokens(1, () => {
            msg.time = new Date();
            this.push(msg);
            callback();
        });
    }
}
exports.default = RateLimiter;
//# sourceMappingURL=RateLimiter.js.map