// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Root from '../root/root.js';
/**
 * @interface
 */
export class Revealer {
    /**
     * @param {!Object} object
     * @param {boolean=} omitFocus
     * @return {!Promise<void>}
     */
    reveal(object, omitFocus) {
        throw new Error('not implemented');
    }
}
/**
 * @param {?Object} revealable
 * @param {boolean=} omitFocus
 * @return {!Promise.<void>}
 */
export let reveal = function (revealable, omitFocus) {
    if (!revealable) {
        return Promise.reject(new Error('Can\'t reveal ' + revealable));
    }
    return Root.Runtime.Runtime.instance()
        .allInstances(Revealer, revealable)
        .then(revealers => reveal(/** @type {!Array<!Revealer>} */ (revealers)));
    /**
     * @param {!Array.<!Revealer>} revealers
     * @return {!Promise.<void>}
     */
    function reveal(revealers) {
        const promises = [];
        for (let i = 0; i < revealers.length; ++i) {
            promises.push(revealers[i].reveal(/** @type {!Object} */ (revealable), omitFocus));
        }
        return Promise.race(promises);
    }
};
/**
 * @param {function(?Object, boolean=):!Promise.<undefined>} newReveal
 */
export function setRevealForTest(newReveal) {
    reveal = newReveal;
}
/**
 * @param {?Object} revealable
 * @return {?string}
 */
export const revealDestination = function (revealable) {
    const extension = Root.Runtime.Runtime.instance().extension(Revealer, revealable);
    if (!extension) {
        return null;
    }
    return extension.descriptor()['destination'];
};
//# sourceMappingURL=Revealer.js.map