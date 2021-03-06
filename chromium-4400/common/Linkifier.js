// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Root from '../root/root.js';
/**
 * @interface
 */
export class Linkifier {
    /**
     * @param {!Object} object
     * @param {!Options=} options
     * @return {!Node}
     */
    linkify(object, options) {
        throw new Error('linkify not implemented');
    }
    /**
     * @param {?Object} object
     * @param {!Options=} options
     * @return {!Promise<!Node>}
     */
    static linkify(object, options) {
        if (!object) {
            return Promise.reject(new Error('Can\'t linkify ' + object));
        }
        return /** @type {!Root.Runtime.Extension} */ (Root.Runtime.Runtime.instance().extension(Linkifier, object))
            .instance()
            .then(linkifier => /** @type {!Linkifier} */ (linkifier).linkify(/** @type {!Object} */ (object), options));
    }
}
/** @typedef {{tooltip: (string|undefined), preventKeyboardFocus: (boolean|undefined)}} */
// @ts-ignore typedef.
export let Options;
//# sourceMappingURL=Linkifier.js.map