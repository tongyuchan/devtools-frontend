/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
/**
 * @implements {ProtocolProxyApi.StorageDispatcher}
 */
export class IndexedDBModel extends SDK.SDKModel.SDKModel {
    /**
     * @param {!SDK.SDKModel.Target} target
     */
    constructor(target) {
        super(target);
        target.registerStorageDispatcher(this);
        this._securityOriginManager = target.model(SDK.SecurityOriginManager.SecurityOriginManager);
        this._indexedDBAgent = target.indexedDBAgent();
        this._storageAgent = target.storageAgent();
        /** @type {!Map.<!DatabaseId, !Database>} */
        this._databases = new Map();
        /** @type {!Object.<string, !Array.<string>>} */
        this._databaseNamesBySecurityOrigin = {};
        this._originsUpdated = new Set();
        this._throttler = new Common.Throttler.Throttler(1000);
    }
    /**
     * @param {*} idbKey
     * @return {(!Protocol.IndexedDB.Key|undefined)}
     */
    static keyFromIDBKey(idbKey) {
        if (typeof (idbKey) === 'undefined' || idbKey === null) {
            return undefined;
        }
        /** @type {!Protocol.IndexedDB.Key} */
        let key;
        switch (typeof (idbKey)) {
            case 'number':
                key = {
                    type: Protocol.IndexedDB.KeyType.Number,
                    number: idbKey,
                };
                break;
            case 'string':
                key = {
                    type: Protocol.IndexedDB.KeyType.String,
                    string: idbKey,
                };
                break;
            case 'object':
                if (idbKey instanceof Date) {
                    key = {
                        type: Protocol.IndexedDB.KeyType.Date,
                        date: idbKey.getTime(),
                    };
                }
                else if (Array.isArray(idbKey)) {
                    const array = [];
                    for (let i = 0; i < idbKey.length; ++i) {
                        const nestedKey = IndexedDBModel.keyFromIDBKey(idbKey[i]);
                        if (nestedKey) {
                            array.push(nestedKey);
                        }
                    }
                    key = {
                        type: Protocol.IndexedDB.KeyType.Array,
                        array,
                    };
                }
                else {
                    return undefined;
                }
                break;
            default:
                return undefined;
        }
        return key;
    }
    /**
     * @param {!IDBKeyRange} idbKeyRange
     * @return {!Protocol.IndexedDB.KeyRange}
     */
    static _keyRangeFromIDBKeyRange(idbKeyRange) {
        const keyRange = {};
        keyRange.lower = IndexedDBModel.keyFromIDBKey(idbKeyRange.lower);
        keyRange.upper = IndexedDBModel.keyFromIDBKey(idbKeyRange.upper);
        keyRange.lowerOpen = Boolean(idbKeyRange.lowerOpen);
        keyRange.upperOpen = Boolean(idbKeyRange.upperOpen);
        return keyRange;
    }
    /**
     * @param {!Protocol.IndexedDB.KeyPath} keyPath
     * @return {?string|!Array.<string>|undefined}
     */
    static idbKeyPathFromKeyPath(keyPath) {
        let idbKeyPath;
        switch (keyPath.type) {
            case Protocol.IndexedDB.KeyPathType.Null:
                idbKeyPath = null;
                break;
            case Protocol.IndexedDB.KeyPathType.String:
                idbKeyPath = keyPath.string;
                break;
            case Protocol.IndexedDB.KeyPathType.Array:
                idbKeyPath = keyPath.array;
                break;
        }
        return idbKeyPath;
    }
    /**
     * @param {?string|!Array.<string>|undefined} idbKeyPath
     * @return {?string}
     */
    static keyPathStringFromIDBKeyPath(idbKeyPath) {
        if (typeof idbKeyPath === 'string') {
            return '"' + idbKeyPath + '"';
        }
        if (idbKeyPath instanceof Array) {
            return '["' + idbKeyPath.join('", "') + '"]';
        }
        return null;
    }
    enable() {
        if (this._enabled) {
            return;
        }
        this._indexedDBAgent.invoke_enable();
        if (this._securityOriginManager) {
            this._securityOriginManager.addEventListener(SDK.SecurityOriginManager.Events.SecurityOriginAdded, this._securityOriginAdded, this);
            this._securityOriginManager.addEventListener(SDK.SecurityOriginManager.Events.SecurityOriginRemoved, this._securityOriginRemoved, this);
            for (const securityOrigin of this._securityOriginManager.securityOrigins()) {
                this._addOrigin(securityOrigin);
            }
        }
        this._enabled = true;
    }
    /**
     * @param {string} origin
     */
    clearForOrigin(origin) {
        if (!this._enabled || !this._databaseNamesBySecurityOrigin[origin]) {
            return;
        }
        this._removeOrigin(origin);
        this._addOrigin(origin);
    }
    /**
     * @param {!DatabaseId} databaseId
     */
    async deleteDatabase(databaseId) {
        if (!this._enabled) {
            return;
        }
        await this._indexedDBAgent.invoke_deleteDatabase({ securityOrigin: databaseId.securityOrigin, databaseName: databaseId.name });
        this._loadDatabaseNames(databaseId.securityOrigin);
    }
    async refreshDatabaseNames() {
        for (const securityOrigin in this._databaseNamesBySecurityOrigin) {
            await this._loadDatabaseNames(securityOrigin);
        }
        this.dispatchEventToListeners(Events.DatabaseNamesRefreshed);
    }
    /**
     * @param {!DatabaseId} databaseId
     */
    refreshDatabase(databaseId) {
        this._loadDatabase(databaseId, true);
    }
    /**
     * @param {!DatabaseId} databaseId
     * @param {string} objectStoreName
     * @return {!Promise<void>}
     */
    async clearObjectStore(databaseId, objectStoreName) {
        await this._indexedDBAgent.invoke_clearObjectStore({ securityOrigin: databaseId.securityOrigin, databaseName: databaseId.name, objectStoreName });
    }
    /**
     * @param {!DatabaseId} databaseId
     * @param {string} objectStoreName
     * @param {!IDBKeyRange} idbKeyRange
     * @return {!Promise<void>}
     */
    async deleteEntries(databaseId, objectStoreName, idbKeyRange) {
        const keyRange = IndexedDBModel._keyRangeFromIDBKeyRange(idbKeyRange);
        await this._indexedDBAgent.invoke_deleteObjectStoreEntries({ securityOrigin: databaseId.securityOrigin, databaseName: databaseId.name, objectStoreName, keyRange });
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _securityOriginAdded(event) {
        const securityOrigin = /** @type {string} */ (event.data);
        this._addOrigin(securityOrigin);
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _securityOriginRemoved(event) {
        const securityOrigin = /** @type {string} */ (event.data);
        this._removeOrigin(securityOrigin);
    }
    /**
     * @param {string} securityOrigin
     */
    _addOrigin(securityOrigin) {
        console.assert(!this._databaseNamesBySecurityOrigin[securityOrigin]);
        this._databaseNamesBySecurityOrigin[securityOrigin] = [];
        this._loadDatabaseNames(securityOrigin);
        if (this._isValidSecurityOrigin(securityOrigin)) {
            this._storageAgent.invoke_trackIndexedDBForOrigin({ origin: securityOrigin });
        }
    }
    /**
     * @param {string} securityOrigin
     */
    _removeOrigin(securityOrigin) {
        console.assert(Boolean(this._databaseNamesBySecurityOrigin[securityOrigin]));
        for (let i = 0; i < this._databaseNamesBySecurityOrigin[securityOrigin].length; ++i) {
            this._databaseRemoved(securityOrigin, this._databaseNamesBySecurityOrigin[securityOrigin][i]);
        }
        delete this._databaseNamesBySecurityOrigin[securityOrigin];
        if (this._isValidSecurityOrigin(securityOrigin)) {
            this._storageAgent.invoke_untrackIndexedDBForOrigin({ origin: securityOrigin });
        }
    }
    /**
     * @param {string} securityOrigin
     * @return {boolean}
     */
    _isValidSecurityOrigin(securityOrigin) {
        const parsedURL = Common.ParsedURL.ParsedURL.fromString(securityOrigin);
        return parsedURL !== null && parsedURL.scheme.startsWith('http');
    }
    /**
     * @param {string} securityOrigin
     * @param {!Array.<string>} databaseNames
     */
    _updateOriginDatabaseNames(securityOrigin, databaseNames) {
        const newDatabaseNames = new Set(databaseNames);
        const oldDatabaseNames = new Set(this._databaseNamesBySecurityOrigin[securityOrigin]);
        this._databaseNamesBySecurityOrigin[securityOrigin] = databaseNames;
        for (const databaseName of oldDatabaseNames) {
            if (!newDatabaseNames.has(databaseName)) {
                this._databaseRemoved(securityOrigin, databaseName);
            }
        }
        for (const databaseName of newDatabaseNames) {
            if (!oldDatabaseNames.has(databaseName)) {
                this._databaseAdded(securityOrigin, databaseName);
            }
        }
    }
    /**
     * @return {!Array.<!DatabaseId>}
     */
    databases() {
        const result = [];
        for (const securityOrigin in this._databaseNamesBySecurityOrigin) {
            const databaseNames = this._databaseNamesBySecurityOrigin[securityOrigin];
            for (let i = 0; i < databaseNames.length; ++i) {
                result.push(new DatabaseId(securityOrigin, databaseNames[i]));
            }
        }
        return result;
    }
    /**
     * @param {string} securityOrigin
     * @param {string} databaseName
     */
    _databaseAdded(securityOrigin, databaseName) {
        const databaseId = new DatabaseId(securityOrigin, databaseName);
        this.dispatchEventToListeners(Events.DatabaseAdded, { model: this, databaseId: databaseId });
    }
    /**
     * @param {string} securityOrigin
     * @param {string} databaseName
     */
    _databaseRemoved(securityOrigin, databaseName) {
        const databaseId = new DatabaseId(securityOrigin, databaseName);
        this.dispatchEventToListeners(Events.DatabaseRemoved, { model: this, databaseId: databaseId });
    }
    /**
     * @param {string} securityOrigin
     * @return {!Promise<!Array.<string>>} databaseNames
     */
    async _loadDatabaseNames(securityOrigin) {
        const { databaseNames } = await this._indexedDBAgent.invoke_requestDatabaseNames({ securityOrigin });
        if (!databaseNames) {
            return [];
        }
        if (!this._databaseNamesBySecurityOrigin[securityOrigin]) {
            return [];
        }
        this._updateOriginDatabaseNames(securityOrigin, databaseNames);
        return databaseNames;
    }
    /**
     * @param {!DatabaseId} databaseId
     * @param {boolean} entriesUpdated
     */
    async _loadDatabase(databaseId, entriesUpdated) {
        const { databaseWithObjectStores } = await this._indexedDBAgent.invoke_requestDatabase({ securityOrigin: databaseId.securityOrigin, databaseName: databaseId.name });
        if (!databaseWithObjectStores) {
            return;
        }
        if (!this._databaseNamesBySecurityOrigin[databaseId.securityOrigin]) {
            return;
        }
        const databaseModel = new Database(databaseId, databaseWithObjectStores.version);
        this._databases.set(databaseId, databaseModel);
        for (const objectStore of databaseWithObjectStores.objectStores) {
            const objectStoreIDBKeyPath = IndexedDBModel.idbKeyPathFromKeyPath(objectStore.keyPath);
            const objectStoreModel = new ObjectStore(objectStore.name, objectStoreIDBKeyPath, objectStore.autoIncrement);
            for (let j = 0; j < objectStore.indexes.length; ++j) {
                const index = objectStore.indexes[j];
                const indexIDBKeyPath = IndexedDBModel.idbKeyPathFromKeyPath(index.keyPath);
                const indexModel = new Index(index.name, indexIDBKeyPath, index.unique, index.multiEntry);
                objectStoreModel.indexes.set(indexModel.name, indexModel);
            }
            databaseModel.objectStores.set(objectStoreModel.name, objectStoreModel);
        }
        this.dispatchEventToListeners(Events.DatabaseLoaded, { model: this, database: databaseModel, entriesUpdated: entriesUpdated });
    }
    /**
     * @param {!DatabaseId} databaseId
     * @param {string} objectStoreName
     * @param {?IDBKeyRange} idbKeyRange
     * @param {number} skipCount
     * @param {number} pageSize
     * @param {function(!Array.<!Entry>, boolean):void} callback
     */
    loadObjectStoreData(databaseId, objectStoreName, idbKeyRange, skipCount, pageSize, callback) {
        this._requestData(databaseId, databaseId.name, objectStoreName, '', idbKeyRange, skipCount, pageSize, callback);
    }
    /**
     * @param {!DatabaseId} databaseId
     * @param {string} objectStoreName
     * @param {string} indexName
     * @param {?IDBKeyRange} idbKeyRange
     * @param {number} skipCount
     * @param {number} pageSize
     * @param {function(!Array.<!Entry>, boolean):void} callback
     */
    loadIndexData(databaseId, objectStoreName, indexName, idbKeyRange, skipCount, pageSize, callback) {
        this._requestData(databaseId, databaseId.name, objectStoreName, indexName, idbKeyRange, skipCount, pageSize, callback);
    }
    /**
     * @param {!DatabaseId} databaseId
     * @param {string} databaseName
     * @param {string} objectStoreName
     * @param {string} indexName
     * @param {?IDBKeyRange} idbKeyRange
     * @param {number} skipCount
     * @param {number} pageSize
     * @param {function(!Array.<!Entry>, boolean):void} callback
     */
    async _requestData(databaseId, databaseName, objectStoreName, indexName, idbKeyRange, skipCount, pageSize, callback) {
        const keyRange = idbKeyRange ? IndexedDBModel._keyRangeFromIDBKeyRange(idbKeyRange) : undefined;
        const response = await this._indexedDBAgent.invoke_requestData({
            securityOrigin: databaseId.securityOrigin,
            databaseName,
            objectStoreName,
            indexName,
            skipCount,
            pageSize,
            keyRange
        });
        if (response.getError()) {
            console.error('IndexedDBAgent error: ' + response.getError());
            return;
        }
        const runtimeModel = this.target().model(SDK.RuntimeModel.RuntimeModel);
        if (!runtimeModel || !this._databaseNamesBySecurityOrigin[databaseId.securityOrigin]) {
            return;
        }
        const dataEntries = response.objectStoreDataEntries;
        const entries = [];
        for (const dataEntry of dataEntries) {
            const key = runtimeModel.createRemoteObject(dataEntry.key);
            const primaryKey = runtimeModel.createRemoteObject(dataEntry.primaryKey);
            const value = runtimeModel.createRemoteObject(dataEntry.value);
            entries.push(new Entry(key, primaryKey, value));
        }
        callback(entries, response.hasMore);
    }
    /**
     * @param {!DatabaseId} databaseId
     * @param {!ObjectStore} objectStore
     * @return {!Promise<?ObjectStoreMetadata>}
     */
    async getMetadata(databaseId, objectStore) {
        const databaseOrigin = databaseId.securityOrigin;
        const databaseName = databaseId.name;
        const objectStoreName = objectStore.name;
        const response = await this._indexedDBAgent.invoke_getMetadata({ securityOrigin: databaseOrigin, databaseName, objectStoreName });
        if (response.getError()) {
            console.error('IndexedDBAgent error: ' + response.getError());
            return null;
        }
        return { entriesCount: response.entriesCount, keyGeneratorValue: response.keyGeneratorValue };
    }
    /**
     * @param {string} securityOrigin
     */
    async _refreshDatabaseList(securityOrigin) {
        const databaseNames = await this._loadDatabaseNames(securityOrigin);
        for (const databaseName of databaseNames) {
            this._loadDatabase(new DatabaseId(securityOrigin, databaseName), false);
        }
    }
    /**
     * @override
     * @param {!Protocol.Storage.IndexedDBListUpdatedEvent} event
     */
    indexedDBListUpdated({ origin: securityOrigin }) {
        this._originsUpdated.add(securityOrigin);
        this._throttler.schedule(() => {
            const promises = Array.from(this._originsUpdated, securityOrigin => {
                this._refreshDatabaseList(securityOrigin);
            });
            this._originsUpdated.clear();
            return Promise.all(promises);
        });
    }
    /**
     * @override
     * @param {!Protocol.Storage.IndexedDBContentUpdatedEvent} event
     */
    indexedDBContentUpdated({ origin: securityOrigin, databaseName, objectStoreName }) {
        const databaseId = new DatabaseId(securityOrigin, databaseName);
        this.dispatchEventToListeners(Events.IndexedDBContentUpdated, { databaseId: databaseId, objectStoreName: objectStoreName, model: this });
    }
    /**
     * @override
     * @param {!Protocol.Storage.CacheStorageListUpdatedEvent} event
     */
    cacheStorageListUpdated(event) {
    }
    /**
     * @override
     * @param {!Protocol.Storage.CacheStorageContentUpdatedEvent} event
     */
    cacheStorageContentUpdated(event) {
    }
}
SDK.SDKModel.SDKModel.register(IndexedDBModel, SDK.SDKModel.Capability.Storage, false);
/** @enum {symbol} */
export const Events = {
    DatabaseAdded: Symbol('DatabaseAdded'),
    DatabaseRemoved: Symbol('DatabaseRemoved'),
    DatabaseLoaded: Symbol('DatabaseLoaded'),
    DatabaseNamesRefreshed: Symbol('DatabaseNamesRefreshed'),
    IndexedDBContentUpdated: Symbol('IndexedDBContentUpdated')
};
export class Entry {
    /**
     * @param {!SDK.RemoteObject.RemoteObject} key
     * @param {!SDK.RemoteObject.RemoteObject} primaryKey
     * @param {!SDK.RemoteObject.RemoteObject} value
     */
    constructor(key, primaryKey, value) {
        this.key = key;
        this.primaryKey = primaryKey;
        this.value = value;
    }
}
export class DatabaseId {
    /**
     * @param {string} securityOrigin
     * @param {string} name
     */
    constructor(securityOrigin, name) {
        this.securityOrigin = securityOrigin;
        this.name = name;
    }
    /**
     * @param {!DatabaseId} databaseId
     * @return {boolean}
     */
    equals(databaseId) {
        return this.name === databaseId.name && this.securityOrigin === databaseId.securityOrigin;
    }
}
export class Database {
    /**
     * @param {!DatabaseId} databaseId
     * @param {number} version
     */
    constructor(databaseId, version) {
        this.databaseId = databaseId;
        this.version = version;
        /** @type {!Map<string, !ObjectStore>} */
        this.objectStores = new Map();
    }
}
export class ObjectStore {
    /**
     * @param {string} name
     * @param {*} keyPath
     * @param {boolean} autoIncrement
     */
    constructor(name, keyPath, autoIncrement) {
        this.name = name;
        this.keyPath = keyPath;
        this.autoIncrement = autoIncrement;
        /** @type {!Map<string, !Index>} */
        this.indexes = new Map();
    }
    /**
     * @return {string}
     */
    get keyPathString() {
        return /** @type {string}*/ (IndexedDBModel.keyPathStringFromIDBKeyPath(/** @type {string}*/ (this.keyPath)));
    }
}
export class Index {
    /**
     * @param {string} name
     * @param {*} keyPath
     * @param {boolean} unique
     * @param {boolean} multiEntry
     */
    constructor(name, keyPath, unique, multiEntry) {
        this.name = name;
        this.keyPath = keyPath;
        this.unique = unique;
        this.multiEntry = multiEntry;
    }
    /**
     * @return {string}
     */
    get keyPathString() {
        return /** @type {string}*/ (IndexedDBModel.keyPathStringFromIDBKeyPath(/** @type {string}*/ (this.keyPath)));
    }
}
/**
 * @typedef {{
 *      entriesCount: number,
 *      keyGeneratorValue: number
 * }}
 */
// @ts-ignore typedef
export let ObjectStoreMetadata;
//# sourceMappingURL=IndexedDBModel.js.map