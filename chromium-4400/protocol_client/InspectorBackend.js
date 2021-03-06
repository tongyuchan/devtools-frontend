/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
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
import { NodeURL } from './NodeURL.js';
/**
 * @typedef {string}
 */
export const ProtocolError = Symbol('Protocol.Error');
export const DevToolsStubErrorCode = -32015;
// TODO(dgozman): we are not reporting generic errors in tests, but we should
// instead report them and just have some expected errors in test expectations.
const _GenericError = -32000;
const _ConnectionClosedErrorCode = -32001;
export class InspectorBackend {
    constructor() {
        /** @type {!Map<string, !_AgentPrototype>} */
        this._agentPrototypes = new Map();
        /** @type {!Map<string, !_DispatcherPrototype>} */
        this._dispatcherPrototypes = new Map();
        this._initialized = false;
    }
    /**
     * @param {string} error
     * @param {!Object} messageObject
     */
    static reportProtocolError(error, messageObject) {
        console.error(error + ': ' + JSON.stringify(messageObject));
    }
    /**
     * @param {string} error
     * @param {!Object} messageObject
     */
    static reportProtocolWarning(error, messageObject) {
        console.warn(error + ': ' + JSON.stringify(messageObject));
    }
    /**
     * @return {boolean}
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * @param {string} domain
     */
    _addAgentGetterMethodToProtocolTargetPrototype(domain) {
        let upperCaseLength = 0;
        while (upperCaseLength < domain.length && domain[upperCaseLength].toLowerCase() !== domain[upperCaseLength]) {
            ++upperCaseLength;
        }
        const methodName = domain.substr(0, upperCaseLength).toLowerCase() + domain.slice(upperCaseLength) + 'Agent';
        /**
         * @this {TargetBase}
         */
        function agentGetter() {
            return this._agents[domain];
        }
        // @ts-ignore Method code generation
        TargetBase.prototype[methodName] = agentGetter;
        /**
         * @this {TargetBase}
         * @param {!_DispatcherPrototype} dispatcher
         */
        function registerDispatcher(dispatcher) {
            this.registerDispatcher(domain, dispatcher);
        }
        // @ts-ignore Method code generation
        TargetBase.prototype['register' + domain + 'Dispatcher'] = registerDispatcher;
        /**
         * @this {TargetBase}
         * @param {!_DispatcherPrototype} dispatcher
         */
        function unregisterDispatcher(dispatcher) {
            this.unregisterDispatcher(domain, dispatcher);
        }
        // @ts-ignore Method code generation
        TargetBase.prototype['unregister' + domain + 'Dispatcher'] = unregisterDispatcher;
    }
    /**
     * @param {string} domain
     * @return {!_AgentPrototype}
     */
    _agentPrototype(domain) {
        if (!this._agentPrototypes.has(domain)) {
            this._agentPrototypes.set(domain, new _AgentPrototype(domain));
            this._addAgentGetterMethodToProtocolTargetPrototype(domain);
        }
        return /** @type {!_AgentPrototype} */ (this._agentPrototypes.get(domain));
    }
    /**
     * @param {string} domain
     * @return {!_DispatcherPrototype}
     */
    _dispatcherPrototype(domain) {
        if (!this._dispatcherPrototypes.has(domain)) {
            this._dispatcherPrototypes.set(domain, new _DispatcherPrototype());
        }
        return /** @type {!_DispatcherPrototype} */ (this._dispatcherPrototypes.get(domain));
    }
    /**
     * @param {string} method
     * @param {!Array.<!{name: string, type: string, optional: boolean}>} signature
     * @param {!Array.<string>} replyArgs
     */
    registerCommand(method, signature, replyArgs) {
        const domainAndMethod = method.split('.');
        this._agentPrototype(domainAndMethod[0]).registerCommand(domainAndMethod[1], signature, replyArgs);
        this._initialized = true;
    }
    /**
     * @param {string} type
     * @param {!Object} values
     */
    registerEnum(type, values) {
        const domainAndName = type.split('.');
        const domain = domainAndName[0];
        // @ts-ignore Protocol global namespace pollution
        if (!Protocol[domain]) {
            // @ts-ignore Protocol global namespace pollution
            Protocol[domain] = {};
        }
        // @ts-ignore Protocol global namespace pollution
        Protocol[domain][domainAndName[1]] = values;
        this._initialized = true;
    }
    /**
     * @param {string} eventName
     * @param {!Object} params
     */
    registerEvent(eventName, params) {
        const domain = eventName.split('.')[0];
        this._dispatcherPrototype(domain).registerEvent(eventName, params);
        this._initialized = true;
    }
    /**
     * @param {function((T|undefined)):void} clientCallback
     * @param {string} errorPrefix
     * @param {function(new:T,S):void=} constructor
     * @param {T=} defaultValue
     * @return {function(?string, S):void}
     * @template T,S
     */
    wrapClientCallback(clientCallback, errorPrefix, constructor, defaultValue) {
        /**
         * @param {?string} error
         * @param {S} value
         * @template S
         */
        function callbackWrapper(error, value) {
            if (error) {
                console.error(errorPrefix + error);
                clientCallback(defaultValue);
                return;
            }
            if (constructor) {
                // @ts-ignore Special casting
                clientCallback(new constructor(value));
            }
            else {
                // @ts-ignore Special casting
                clientCallback(value);
            }
        }
        return callbackWrapper;
    }
}
/** @type {function():!Connection} */
let _factory;
/**
 * @interface
 */
export class Connection {
    constructor() {
        /** @type {?function(!Object):void} */
        this._onMessage;
    }
    /**
     * @param {function((!Object|string)):void} onMessage
     */
    setOnMessage(onMessage) {
    }
    /**
     * @param {function(string):void} onDisconnect
     */
    setOnDisconnect(onDisconnect) {
    }
    /**
     * @param {string} message
     */
    sendRawMessage(message) {
    }
    /**
     * @return {!Promise<void>}
     */
    disconnect() {
        throw new Error('not implemented');
    }
    /**
     * @param {function():!Connection} factory
     */
    static setFactory(factory) {
        _factory = factory;
    }
    /**
     * @return {function():!Connection}
     */
    static getFactory() {
        return _factory;
    }
}
/** @typedef {function(...*):void} */
let SendRawMessageCallback; // eslint-disable-line no-unused-vars
export const test = {
    /**
     * This will get called for every protocol message.
     * ProtocolClient.test.dumpProtocol = console.log
     * @type {?function(string):void}
     */
    dumpProtocol: null,
    /**
     * Runs a function when no protocol activity is present.
     * ProtocolClient.test.deprecatedRunAfterPendingDispatches(() => console.log('done'))
     * @type {?function(function():void=):void}
     */
    deprecatedRunAfterPendingDispatches: null,
    /**
     * Sends a raw message over main connection.
     * ProtocolClient.test.sendRawMessage('Page.enable', {}, console.log)
     * @type {?function(string, ?Object, ?SendRawMessageCallback):void}
     */
    sendRawMessage: null,
    /**
     * Set to true to not log any errors.
     */
    suppressRequestErrors: false,
    /**
     * Set to get notified about any messages sent over protocol.
     * @type {?function({domain: string, method: string, params: !Object, id: number}, ?TargetBase):void}
     */
    onMessageSent: null,
    /**
     * Set to get notified about any messages received over protocol.
     * @type {?function(!Object, ?TargetBase):void}
     */
    onMessageReceived: null,
};
const LongPollingMethods = new Set(['CSS.takeComputedStyleUpdates']);
export class SessionRouter {
    /**
     * @param {!Connection} connection
     */
    constructor(connection) {
        this._connection = connection;
        this._lastMessageId = 1;
        this._pendingResponsesCount = 0;
        /** @type {!Set<number>} */
        this._pendingLongPollingMessageIds = new Set();
        this._domainToLogger = new Map();
        /** @type {!Map<string, {target: !TargetBase, callbacks: !Map<number, !_CallbackWithDebugInfo>, proxyConnection: (?Connection|undefined)}>} */
        this._sessions = new Map();
        /** @type {!Array<function():void>} */
        this._pendingScripts = [];
        test.deprecatedRunAfterPendingDispatches = this._deprecatedRunAfterPendingDispatches.bind(this);
        test.sendRawMessage = this._sendRawMessageForTesting.bind(this);
        this._connection.setOnMessage(this._onMessage.bind(this));
        this._connection.setOnDisconnect(reason => {
            const session = this._sessions.get('');
            if (session) {
                session.target.dispose(reason);
            }
        });
    }
    /**
     * @param {!TargetBase} target
     * @param {string} sessionId
     * @param {?Connection=} proxyConnection
     */
    registerSession(target, sessionId, proxyConnection) {
        // Only the Audits panel uses proxy connections. If it is ever possible to have multiple active at the
        // same time, it should be tested thoroughly.
        if (proxyConnection) {
            for (const session of this._sessions.values()) {
                if (session.proxyConnection) {
                    console.error('Multiple simultaneous proxy connections are currently unsupported');
                    break;
                }
            }
        }
        this._sessions.set(sessionId, { target, callbacks: new Map(), proxyConnection });
    }
    /**
     * @param {string} sessionId
     */
    unregisterSession(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session) {
            return;
        }
        for (const callback of session.callbacks.values()) {
            SessionRouter.dispatchUnregisterSessionError(callback);
        }
        this._sessions.delete(sessionId);
    }
    /**
     * @param {string} sessionId
     * @return {?TargetBase}
     */
    _getTargetBySessionId(sessionId) {
        const session = this._sessions.get(sessionId ? sessionId : '');
        if (!session) {
            return null;
        }
        return session.target;
    }
    /**
     * @return {number}
     */
    _nextMessageId() {
        return this._lastMessageId++;
    }
    /**
     * @return {!Connection}
     */
    connection() {
        return this._connection;
    }
    /**
     * @param {string} sessionId
     * @param {string} domain
     * @param {string} method
     * @param {?Object} params
     * @param {!_Callback} callback
     */
    sendMessage(sessionId, domain, method, params, callback) {
        const messageObject = {};
        const messageId = this._nextMessageId();
        messageObject.id = messageId;
        messageObject.method = method;
        if (params) {
            messageObject.params = params;
        }
        if (sessionId) {
            messageObject.sessionId = sessionId;
        }
        if (test.dumpProtocol) {
            test.dumpProtocol('frontend: ' + JSON.stringify(messageObject));
        }
        if (test.onMessageSent) {
            const paramsObject = JSON.parse(JSON.stringify(params || {}));
            test.onMessageSent({ domain, method, params: /** @type {!Object} */ (paramsObject), id: messageId }, this._getTargetBySessionId(sessionId));
        }
        ++this._pendingResponsesCount;
        if (LongPollingMethods.has(method)) {
            this._pendingLongPollingMessageIds.add(messageId);
        }
        const session = this._sessions.get(sessionId);
        if (!session) {
            return;
        }
        session.callbacks.set(messageId, { callback, method });
        this._connection.sendRawMessage(JSON.stringify(messageObject));
    }
    /**
     * @param {string} method
     * @param {?Object} params
     * @param {?function(...*):void} callback
     */
    _sendRawMessageForTesting(method, params, callback) {
        const domain = method.split('.')[0];
        this.sendMessage('', domain, method, params, callback || (() => { }));
    }
    /**
     * @param {!Object|string} message
     */
    _onMessage(message) {
        if (test.dumpProtocol) {
            test.dumpProtocol('backend: ' + ((typeof message === 'string') ? message : JSON.stringify(message)));
        }
        if (test.onMessageReceived) {
            const messageObjectCopy = JSON.parse((typeof message === 'string') ? message : JSON.stringify(message));
            test.onMessageReceived(
            /** @type {!Object} */ (messageObjectCopy), this._getTargetBySessionId(messageObjectCopy.sessionId));
        }
        const messageObject = 
        /** @type {!{sessionId: string, url: string, id: number, error: ?Object, result: ?Object}|!{sessionId: string, url: string, method: string, params: !Array<string>}} */
        ((typeof message === 'string') ? JSON.parse(message) : message);
        // Send all messages to proxy connections.
        let suppressUnknownMessageErrors = false;
        for (const session of this._sessions.values()) {
            if (!session.proxyConnection) {
                continue;
            }
            if (!session.proxyConnection._onMessage) {
                InspectorBackend.reportProtocolError('Protocol Error: the session has a proxyConnection with no _onMessage', messageObject);
                continue;
            }
            session.proxyConnection._onMessage(messageObject);
            suppressUnknownMessageErrors = true;
        }
        const sessionId = messageObject.sessionId || '';
        const session = this._sessions.get(sessionId);
        if (!session) {
            if (!suppressUnknownMessageErrors) {
                InspectorBackend.reportProtocolError('Protocol Error: the message with wrong session id', messageObject);
            }
            return;
        }
        // If this message is directly for the target controlled by the proxy connection, don't handle it.
        if (session.proxyConnection) {
            return;
        }
        if (session.target._needsNodeJSPatching) {
            NodeURL.patch(messageObject);
        }
        if ('id' in messageObject) { // just a response for some request
            const callback = session.callbacks.get(messageObject.id);
            session.callbacks.delete(messageObject.id);
            if (!callback) {
                if (!suppressUnknownMessageErrors) {
                    InspectorBackend.reportProtocolError('Protocol Error: the message with wrong id', messageObject);
                }
                return;
            }
            callback.callback(messageObject.error, messageObject.result);
            --this._pendingResponsesCount;
            this._pendingLongPollingMessageIds.delete(messageObject.id);
            if (this._pendingScripts.length && !this._hasOutstandingNonLongPollingRequests()) {
                this._deprecatedRunAfterPendingDispatches();
            }
        }
        else {
            if (!('method' in messageObject)) {
                InspectorBackend.reportProtocolError('Protocol Error: the message without method', messageObject);
                return;
            }
            const method = messageObject.method.split('.');
            const domainName = method[0];
            if (!(domainName in session.target._dispatchers)) {
                InspectorBackend.reportProtocolError(`Protocol Error: the message ${messageObject.method} is for non-existing domain '${domainName}'`, messageObject);
                return;
            }
            session.target._dispatchers[domainName].dispatch(method[1], /** @type {{method: string, params: ?Array<string>}} */ (messageObject));
        }
    }
    _hasOutstandingNonLongPollingRequests() {
        return this._pendingResponsesCount - this._pendingLongPollingMessageIds.size > 0;
    }
    /**
     * @param {function():void=} script
     */
    _deprecatedRunAfterPendingDispatches(script) {
        if (script) {
            this._pendingScripts.push(script);
        }
        // Execute all promises.
        setTimeout(() => {
            if (!this._hasOutstandingNonLongPollingRequests()) {
                this._executeAfterPendingDispatches();
            }
            else {
                this._deprecatedRunAfterPendingDispatches();
            }
        }, 0);
    }
    _executeAfterPendingDispatches() {
        if (!this._hasOutstandingNonLongPollingRequests()) {
            const scripts = this._pendingScripts;
            this._pendingScripts = [];
            for (let id = 0; id < scripts.length; ++id) {
                scripts[id]();
            }
        }
    }
    /**
     * @param {!_Callback} callback
     * @param {string} method
     */
    static dispatchConnectionError(callback, method) {
        const error = {
            message: `Connection is closed, can\'t dispatch pending call to ${method}`,
            code: _ConnectionClosedErrorCode,
            data: null
        };
        setTimeout(() => callback(error, null), 0);
    }
    /**
     * @param {!_CallbackWithDebugInfo} callbackWithDebugInfo
     */
    static dispatchUnregisterSessionError({ callback, method }) {
        const error = {
            message: `Session is unregistering, can\'t dispatch pending call to ${method}`,
            code: _ConnectionClosedErrorCode,
            data: null
        };
        setTimeout(() => callback(error, null), 0);
    }
}
export class TargetBase {
    /**
     * @param {boolean} needsNodeJSPatching
     * @param {?TargetBase} parentTarget
     * @param {string} sessionId
     * @param {?Connection} connection
     */
    constructor(needsNodeJSPatching, parentTarget, sessionId, connection) {
        this._needsNodeJSPatching = needsNodeJSPatching;
        this._sessionId = sessionId;
        if ((!parentTarget && connection) || (!parentTarget && sessionId) || (connection && sessionId)) {
            throw new Error('Either connection or sessionId (but not both) must be supplied for a child target');
        }
        /** @type {!SessionRouter} */
        let router;
        if (sessionId && parentTarget && parentTarget._router) {
            router = parentTarget._router;
        }
        else if (connection) {
            router = new SessionRouter(connection);
        }
        else {
            router = new SessionRouter(_factory());
        }
        /** @type {?SessionRouter} */
        this._router = router;
        router.registerSession(this, this._sessionId);
        /** @type {!Object<string,!_AgentPrototype>} */
        this._agents = {};
        for (const [domain, agentPrototype] of inspectorBackend._agentPrototypes) {
            this._agents[domain] = Object.create(/** @type {!_AgentPrototype} */ (agentPrototype));
            this._agents[domain]._target = this;
        }
        /** @type {!Object<string,_DispatcherPrototype>} */
        this._dispatchers = {};
        for (const [domain, dispatcherPrototype] of inspectorBackend._dispatcherPrototypes) {
            this._dispatchers[domain] = Object.create(/** @type {!_DispatcherPrototype} */ (dispatcherPrototype));
            this._dispatchers[domain]._dispatchers = [];
        }
    }
    /**
     * @param {string} domain
     * @param {!Object} dispatcher
     */
    registerDispatcher(domain, dispatcher) {
        if (!this._dispatchers[domain]) {
            return;
        }
        this._dispatchers[domain].addDomainDispatcher(dispatcher);
    }
    /**
     * @param {string} domain
     * @param {!Object} dispatcher
     */
    unregisterDispatcher(domain, dispatcher) {
        if (!this._dispatchers[domain]) {
            return;
        }
        this._dispatchers[domain].removeDomainDispatcher(dispatcher);
    }
    /**
     * @param {string} reason
     */
    dispose(reason) {
        if (!this._router) {
            return;
        }
        this._router.unregisterSession(this._sessionId);
        this._router = null;
    }
    /**
     * @return {boolean}
     */
    isDisposed() {
        return !this._router;
    }
    markAsNodeJSForTest() {
        this._needsNodeJSPatching = true;
    }
    /**
     * @return {?SessionRouter}
     */
    router() {
        return this._router;
    }
    // Agent accessors, keep alphabetically sorted.
    /**
     * @return {!ProtocolProxyApi.AccessibilityApi}
     */
    accessibilityAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.AnimationApi}
     */
    animationAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.ApplicationCacheApi}
     */
    applicationCacheAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.AuditsApi}
     */
    auditsAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.BackgroundServiceApi}
     */
    backgroundServiceAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.CacheStorageApi}
     */
    cacheStorageAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.CSSApi}
     */
    cssAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.DatabaseApi}
     */
    databaseAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.DebuggerApi}
     */
    debuggerAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.DeviceOrientationApi}
     */
    deviceOrientationAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.DOMApi}
     */
    domAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.DOMDebuggerApi}
     */
    domdebuggerAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.DOMSnapshotApi}
     */
    domsnapshotAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.DOMStorageApi}
     */
    domstorageAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.EmulationApi}
     */
    emulationAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.HeapProfilerApi}
     */
    heapProfilerAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.IndexedDBApi}
     */
    indexedDBAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.InputApi}
     */
    inputAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.IOApi}
     */
    ioAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.InspectorApi}
     */
    inspectorAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.LayerTreeApi}
     */
    layerTreeAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.LogApi}
     */
    logAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.MediaApi}
     */
    mediaAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.MemoryApi}
     */
    memoryAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.NetworkApi}
     */
    networkAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.OverlayApi}
     */
    overlayAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.PageApi}
     */
    pageAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.ProfilerApi}
     */
    profilerAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.PerformanceApi}
     */
    performanceAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.RuntimeApi}
     */
    runtimeAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.SecurityApi}
     */
    securityAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.ServiceWorkerApi}
     */
    serviceWorkerAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.StorageApi}
     */
    storageAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.TargetApi}
     */
    targetAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.TracingApi}
     */
    tracingAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.WebAudioApi}
     */
    webAudioAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @return {!ProtocolProxyApi.WebAuthnApi}
     */
    webAuthnAgent() {
        throw new Error('Implemented in InspectorBackend.js');
    }
    // Dispatcher registration, keep alphabetically sorted.
    /**
     * @param {!ProtocolProxyApi.AnimationDispatcher} dispatcher
     */
    registerAnimationDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.ApplicationCacheDispatcher} dispatcher
     */
    registerApplicationCacheDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.AuditsDispatcher} dispatcher
     */
    registerAuditsDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.CSSDispatcher} dispatcher
     */
    registerCSSDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.DatabaseDispatcher} dispatcher
     */
    registerDatabaseDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.BackgroundServiceDispatcher} dispatcher
     */
    registerBackgroundServiceDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.DebuggerDispatcher} dispatcher
     */
    registerDebuggerDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.DebuggerDispatcher} dispatcher
     */
    unregisterDebuggerDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.DOMDispatcher} dispatcher
     */
    registerDOMDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.DOMStorageDispatcher} dispatcher
     */
    registerDOMStorageDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.HeapProfilerDispatcher} dispatcher
     */
    registerHeapProfilerDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.InspectorDispatcher} dispatcher
     */
    registerInspectorDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.LayerTreeDispatcher} dispatcher
     */
    registerLayerTreeDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.LogDispatcher} dispatcher
     */
    registerLogDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.MediaDispatcher} dispatcher
     */
    registerMediaDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.NetworkDispatcher} dispatcher
     */
    registerNetworkDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.OverlayDispatcher} dispatcher
     */
    registerOverlayDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.PageDispatcher} dispatcher
     */
    registerPageDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.ProfilerDispatcher} dispatcher
     */
    registerProfilerDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.RuntimeDispatcher} dispatcher
     */
    registerRuntimeDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.SecurityDispatcher} dispatcher
     */
    registerSecurityDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.ServiceWorkerDispatcher} dispatcher
     */
    registerServiceWorkerDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.StorageDispatcher} dispatcher
     */
    registerStorageDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.TargetDispatcher} dispatcher
     */
    registerTargetDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.TracingDispatcher} dispatcher
     */
    registerTracingDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
    /**
     * @param {!ProtocolProxyApi.WebAudioDispatcher} dispatcher
     */
    registerWebAudioDispatcher(dispatcher) {
        throw new Error('Implemented in InspectorBackend.js');
    }
}
class _AgentPrototype {
    /**
     * @param {string} domain
     */
    constructor(domain) {
        /** @type {!Object<string, !Array<string>>} */
        this._replyArgs = {};
        this._domain = domain;
        /** @type {!TargetBase} */
        this._target;
    }
    /**
     * @param {string} methodName
     * @param {!Array.<!{name: string, type: string, optional: boolean}>} signature
     * @param {!Array.<string>} replyArgs
     */
    registerCommand(methodName, signature, replyArgs) {
        const domainAndMethod = this._domain + '.' + methodName;
        /**
         * @param {...*} vararg
         * @this {_AgentPrototype}
         * @return {!Promise.<*>}
         */
        function sendMessagePromise(vararg) {
            const params = Array.prototype.slice.call(arguments);
            return _AgentPrototype.prototype._sendMessageToBackendPromise.call(this, domainAndMethod, signature, params);
        }
        // @ts-ignore Method code generation
        this[methodName] = sendMessagePromise;
        /**
         * @param {!Object=} request
         * @return {!Promise<?Object>}
         * @this {_AgentPrototype}
         */
        function invoke(request = {}) {
            return this._invoke(domainAndMethod, request);
        }
        // @ts-ignore Method code generation
        this['invoke_' + methodName] = invoke;
        this._replyArgs[domainAndMethod] = replyArgs;
    }
    /**
     * @param {string} method
     * @param {!Array.<!{name: string, type: string, optional: boolean}>} signature
     * @param {!Array.<*>} args
     * @param {function(string):void} errorCallback
     * @return {?Object}
     */
    _prepareParameters(method, signature, args, errorCallback) {
        /** @type {!Object<string, *>} */
        const params = {};
        let hasParams = false;
        for (const param of signature) {
            const paramName = param['name'];
            const typeName = param['type'];
            const optionalFlag = param['optional'];
            if (!args.length && !optionalFlag) {
                errorCallback(`Protocol Error: Invalid number of arguments for method '${method}' call. ` +
                    `It must have the following arguments ${JSON.stringify(signature)}'.`);
                return null;
            }
            const value = args.shift();
            if (optionalFlag && typeof value === 'undefined') {
                continue;
            }
            if (typeof value !== typeName) {
                errorCallback(`Protocol Error: Invalid type of argument '${paramName}' for method '${method}' call. ` +
                    `It must be '${typeName}' but it is '${typeof value}'.`);
                return null;
            }
            params[paramName] = value;
            hasParams = true;
        }
        if (args.length) {
            errorCallback(`Protocol Error: Extra ${args.length} arguments in a call to method '${method}'.`);
            return null;
        }
        return hasParams ? params : null;
    }
    /**
     * @param {string} method
     * @param {!Array<!{name: string, type: string, optional: boolean}>} signature
     * @param {!Array<*>} args
     * @return {!Promise<?>}
     */
    _sendMessageToBackendPromise(method, signature, args) {
        let errorMessage;
        /**
         * @param {string} message
         */
        function onError(message) {
            console.error(message);
            errorMessage = message;
        }
        const params = this._prepareParameters(method, signature, args, onError);
        if (errorMessage) {
            return Promise.resolve(null);
        }
        return new Promise(resolve => {
            /**
             * @param {*} error
             * @param {*} result
             */
            const callback = (error, result) => {
                if (error) {
                    if (!test.suppressRequestErrors && error.code !== DevToolsStubErrorCode && error.code !== _GenericError &&
                        error.code !== _ConnectionClosedErrorCode) {
                        console.error('Request ' + method + ' failed. ' + JSON.stringify(error));
                    }
                    resolve(null);
                    return;
                }
                const args = this._replyArgs[method];
                resolve(result && args.length ? result[args[0]] : undefined);
            };
            if (!this._target._router) {
                SessionRouter.dispatchConnectionError(callback, method);
            }
            else {
                this._target._router.sendMessage(this._target._sessionId, this._domain, method, params, callback);
            }
        });
    }
    /**
     * @param {string} method
     * @param {?Object} request
     * @return {!Promise<!Object>}
     */
    _invoke(method, request) {
        return new Promise(fulfill => {
            /**
             * @param {*} error
             * @param {*} result
             */
            const callback = (error, result) => {
                if (error && !test.suppressRequestErrors && error.code !== DevToolsStubErrorCode &&
                    error.code !== _GenericError && error.code !== _ConnectionClosedErrorCode) {
                    console.error('Request ' + method + ' failed. ' + JSON.stringify(error));
                }
                if (!result) {
                    result = {};
                }
                if (error) {
                    // TODO(crbug.com/1011811): Remove Old lookup of ProtocolError
                    result[ProtocolError] = error.message;
                    result.getError = () => {
                        return error.message;
                    };
                }
                else {
                    result.getError = () => {
                        return undefined;
                    };
                }
                fulfill(result);
            };
            if (!this._target._router) {
                SessionRouter.dispatchConnectionError(callback, method);
            }
            else {
                this._target._router.sendMessage(this._target._sessionId, this._domain, method, request, callback);
            }
        });
    }
}
class _DispatcherPrototype {
    constructor() {
        /** @type {!Object<string, *>} */
        this._eventArgs = {};
        /** @type {!Array<*>} */
        this._dispatchers;
    }
    /**
     * @param {string} eventName
     * @param {!Object} params
     */
    registerEvent(eventName, params) {
        this._eventArgs[eventName] = params;
    }
    /**
     * @param {!Object} dispatcher
     */
    addDomainDispatcher(dispatcher) {
        this._dispatchers.push(dispatcher);
    }
    /**
     * @param {!Object} dispatcher
     */
    removeDomainDispatcher(dispatcher) {
        const index = this._dispatchers.indexOf(dispatcher);
        if (index === -1) {
            return;
        }
        this._dispatchers.splice(index, 1);
    }
    /**
     * @param {string} functionName
     * @param {!{method: string, params: ?Object.<string, *>|undefined}} messageObject
     */
    dispatch(functionName, messageObject) {
        if (!this._dispatchers.length) {
            return;
        }
        if (!this._eventArgs[messageObject.method]) {
            InspectorBackend.reportProtocolWarning(`Protocol Warning: Attempted to dispatch an unspecified method '${messageObject.method}'`, messageObject);
            return;
        }
        const messageArgument = { ...messageObject.params };
        for (let index = 0; index < this._dispatchers.length; ++index) {
            const dispatcher = this._dispatchers[index];
            if (functionName in dispatcher) {
                dispatcher[functionName].call(dispatcher, messageArgument);
            }
        }
    }
}
/**
 * Takes error and result.
 * @typedef {function(?Object, ?Object):void}
 */
// @ts-ignore typedef
export let _Callback;
/**
 * Takes error and result.
 * @typedef {!{callback: function(?Object, ?Object):void, method: string}}
 */
// @ts-ignore typedef
export let _CallbackWithDebugInfo;
export const inspectorBackend = new InspectorBackend();
//# sourceMappingURL=InspectorBackend.js.map