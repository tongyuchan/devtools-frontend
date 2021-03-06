// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import { RemoteObject } from './RemoteObject.js'; // eslint-disable-line no-unused-vars
import { Capability, SDKModel } from './SDKModel.js'; // eslint-disable-line no-unused-vars
export class IOModel extends SDKModel {
    /**
     * @param {!Target} target
     */
    constructor(target) {
        super(target);
    }
    /**
     * @param {!Protocol.IO.StreamHandle} handle
     * @param {number=} size
     * @param {number=} offset
     * @return {!Promise<string|!ArrayBuffer|null>}
     * @throws {!Error}
     */
    async read(handle, size, offset) {
        const result = await this.target().ioAgent().invoke_read({ handle, offset, size });
        if (result.getError()) {
            throw new Error(result.getError());
        }
        if (result.eof) {
            return null;
        }
        if (result.base64Encoded) {
            return Common.Base64.decode(result.data);
        }
        return result.data;
    }
    /**
     * @param {!Protocol.IO.StreamHandle} handle
     */
    async close(handle) {
        const result = await this.target().ioAgent().invoke_close({ handle });
        if (result.getError()) {
            console.error('Could not close stream.');
        }
    }
    /**
     * @param {!Protocol.Runtime.RemoteObjectId|!RemoteObject} objectOrObjectId
     * @returns {!Promise<!Protocol.IO.StreamHandle>}
     * @throws {!Error}
     */
    async resolveBlob(objectOrObjectId) {
        const objectId = objectOrObjectId instanceof RemoteObject ? objectOrObjectId.objectId : objectOrObjectId;
        if (!objectId) {
            throw new Error('Remote object has undefined objectId');
        }
        const result = await this.target().ioAgent().invoke_resolveBlob({ objectId });
        if (result.getError()) {
            throw new Error(result.getError());
        }
        return `blob:${result.uuid}`;
    }
    /**
     * @param {!Protocol.IO.StreamHandle} handle
     * @throws {!Error}
     */
    async readToString(handle) {
        /** @type {!Array<string>} */
        const strings = [];
        const decoder = new TextDecoder();
        for (;;) {
            const data = await this.read(handle, 1024 * 1024);
            if (data === null) {
                strings.push(decoder.decode());
                break;
            }
            if (data instanceof ArrayBuffer) {
                strings.push(decoder.decode(data, { stream: true }));
            }
            else {
                strings.push(data);
            }
        }
        return strings.join('');
    }
}
SDKModel.register(IOModel, Capability.IO, true);
//# sourceMappingURL=IOModel.js.map