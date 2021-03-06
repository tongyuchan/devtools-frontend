// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Bindings from '../bindings/bindings.js';
import * as Formatter from '../formatter/formatter.js';
import * as Platform from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as TextUtils from '../text_utils/text_utils.js';
/** @type {!WeakMap<!SDK.DebuggerModel.ScopeChainEntry, !Promise<!Map<string, string>>>} */
const scopeToCachedIdentifiersMap = new WeakMap();
/** @type {!WeakMap<!SDK.DebuggerModel.CallFrame, !Map<string,string>>} */
const cachedMapByCallFrame = new WeakMap();
export class Identifier {
    /**
     * @param {string} name
     * @param {number} lineNumber
     * @param {number} columnNumber
     */
    constructor(name, lineNumber, columnNumber) {
        this.name = name;
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
    }
}
/**
 * @param {!SDK.DebuggerModel.ScopeChainEntry} scope
 * @return {!Promise<!Array<!Identifier>>}
 */
export const scopeIdentifiers = async function (scope) {
    if (scope.type() === Protocol.Debugger.ScopeType.Global) {
        return [];
    }
    const startLocation = scope.startLocation();
    const endLocation = scope.endLocation();
    if (!startLocation || !endLocation) {
        return [];
    }
    const script = startLocation.script();
    if (!script || !script.sourceMapURL || script !== endLocation.script()) {
        return [];
    }
    const { content } = await script.requestContent();
    if (!content) {
        return [];
    }
    const text = new TextUtils.Text.Text(content);
    const scopeRange = new TextUtils.TextRange.TextRange(startLocation.lineNumber, startLocation.columnNumber, endLocation.lineNumber, endLocation.columnNumber);
    const scopeText = text.extract(scopeRange);
    const scopeStart = text.toSourceRange(scopeRange).offset;
    const prefix = 'function fui';
    const identifiers = await Formatter.FormatterWorkerPool.formatterWorkerPool().javaScriptIdentifiers(prefix + scopeText);
    const result = [];
    const cursor = new TextUtils.TextCursor.TextCursor(text.lineEndings());
    for (const id of identifiers) {
        if (id.offset < prefix.length) {
            continue;
        }
        const start = scopeStart + id.offset - prefix.length;
        cursor.resetTo(start);
        result.push(new Identifier(id.name, cursor.lineNumber(), cursor.columnNumber()));
    }
    return result;
};
/**
 * @param {?SDK.DebuggerModel.CallFrame} callFrame
 * @return {!Promise<?Array<SDK.DebuggerModel.ScopeChainEntry>>}
 */
export const resolveScopeChain = async function (callFrame) {
    if (!callFrame) {
        return null;
    }
    const { pluginManager } = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
    if (pluginManager) {
        const scopeChain = await pluginManager.resolveScopeChain(callFrame);
        if (scopeChain) {
            return scopeChain;
        }
    }
    return callFrame.scopeChain();
};
/**
 * @param {!SDK.DebuggerModel.ScopeChainEntry} scope
 * @return {!Promise<!Map<string, string>>}
 */
export const resolveScope = async (scope) => {
    let identifiersPromise = scopeToCachedIdentifiersMap.get(scope);
    if (!identifiersPromise) {
        identifiersPromise = (async () => {
            const namesMapping = new Map();
            const script = scope.callFrame().script;
            const sourceMap = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().sourceMapForScript(script);
            if (sourceMap) {
                /** @type {!Map<string, !TextUtils.Text.Text>} */
                const textCache = new Map();
                // Extract as much as possible from SourceMap and resolve
                // missing identifier names from SourceMap ranges.
                const promises = [];
                for (const id of await scopeIdentifiers(scope)) {
                    const entry = sourceMap.findEntry(id.lineNumber, id.columnNumber);
                    if (entry && entry.name) {
                        namesMapping.set(id.name, entry.name);
                    }
                    else {
                        promises.push(resolveSourceName(script, sourceMap, id, textCache).then(sourceName => {
                            if (sourceName) {
                                namesMapping.set(id.name, sourceName);
                            }
                        }));
                    }
                }
                await Promise.all(promises).then(getScopeResolvedForTest());
            }
            return namesMapping;
        })();
        scopeToCachedIdentifiersMap.set(scope, identifiersPromise);
    }
    return await identifiersPromise;
    /**
     * @param {!SDK.Script.Script} script
     * @param {!SDK.SourceMap.SourceMap} sourceMap
     * @param {!Identifier} id
     * @param {!Map<string, !TextUtils.Text.Text>} textCache
     * @return {!Promise<?string>}
     */
    async function resolveSourceName(script, sourceMap, id, textCache) {
        const startEntry = sourceMap.findEntry(id.lineNumber, id.columnNumber);
        const endEntry = sourceMap.findEntry(id.lineNumber, id.columnNumber + id.name.length);
        if (!startEntry || !endEntry || !startEntry.sourceURL || startEntry.sourceURL !== endEntry.sourceURL ||
            !startEntry.sourceLineNumber || !startEntry.sourceColumnNumber || !endEntry.sourceLineNumber ||
            !endEntry.sourceColumnNumber) {
            return null;
        }
        const sourceTextRange = new TextUtils.TextRange.TextRange(startEntry.sourceLineNumber, startEntry.sourceColumnNumber, endEntry.sourceLineNumber, endEntry.sourceColumnNumber);
        const uiSourceCode = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiSourceCodeForSourceMapSourceURL(script.debuggerModel, startEntry.sourceURL, script.isContentScript());
        if (!uiSourceCode) {
            return null;
        }
        const { content } = await uiSourceCode.requestContent();
        if (!content) {
            return null;
        }
        let text = textCache.get(content);
        if (!text) {
            text = new TextUtils.Text.Text(content);
            textCache.set(content, text);
        }
        const originalIdentifier = text.extract(sourceTextRange).trim();
        return /[a-zA-Z0-9_$]+/.test(originalIdentifier) ? originalIdentifier : null;
    }
};
/**
 * @param {!SDK.DebuggerModel.CallFrame} callFrame
 * @return {!Promise<!Map<string, string>>}
 */
export const allVariablesInCallFrame = async (callFrame) => {
    const cachedMap = cachedMapByCallFrame.get(callFrame);
    if (cachedMap) {
        return cachedMap;
    }
    const scopeChain = callFrame.scopeChain();
    const nameMappings = await Promise.all(scopeChain.map(resolveScope));
    /** @type {!Map<string, string>} */
    const reverseMapping = new Map();
    for (const map of nameMappings) {
        for (const [compiledName, originalName] of map) {
            if (originalName && !reverseMapping.has(originalName)) {
                reverseMapping.set(originalName, compiledName);
            }
        }
    }
    cachedMapByCallFrame.set(callFrame, reverseMapping);
    return reverseMapping;
};
/**
 * @param {!SDK.DebuggerModel.CallFrame} callFrame
 * @param {string} originalText
 * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
 * @param {number} lineNumber
 * @param {number} startColumnNumber
 * @param {number} endColumnNumber
 * @return {!Promise<string>}
 */
export const resolveExpression = async (callFrame, originalText, uiSourceCode, lineNumber, startColumnNumber, endColumnNumber) => {
    if (uiSourceCode.mimeType() === 'application/wasm') {
        // For WebAssembly disassembly, lookup the different possiblities.
        return `memories["${originalText}"] ?? locals["${originalText}"] ?? tables["${originalText}"] ?? functions["${originalText}"] ?? globals["${originalText}"]`;
    }
    if (!uiSourceCode.contentType().isFromSourceMap()) {
        return '';
    }
    const reverseMapping = await allVariablesInCallFrame(callFrame);
    if (reverseMapping.has(originalText)) {
        return /** @type {string} */ (reverseMapping.get(originalText));
    }
    const rawLocations = await Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode, lineNumber, startColumnNumber);
    const rawLocation = rawLocations.find(location => location.debuggerModel === callFrame.debuggerModel);
    if (!rawLocation) {
        return '';
    }
    const script = rawLocation.script();
    if (!script) {
        return '';
    }
    const sourceMap = 
    /** @type {!SDK.SourceMap.TextSourceMap} */ (Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().sourceMapForScript(script));
    if (!sourceMap) {
        return '';
    }
    const { content } = await script.requestContent();
    if (!content) {
        return '';
    }
    const text = new TextUtils.Text.Text(content);
    const textRange = sourceMap.reverseMapTextRange(uiSourceCode.url(), new TextUtils.TextRange.TextRange(lineNumber, startColumnNumber, lineNumber, endColumnNumber));
    if (!textRange) {
        return '';
    }
    const subjectText = text.extract(textRange);
    if (!subjectText) {
        return '';
    }
    return await Formatter.FormatterWorkerPool.formatterWorkerPool().evaluatableJavaScriptSubstring(subjectText);
};
/**
 * @param {?SDK.DebuggerModel.CallFrame} callFrame
 * @return {!Promise<?SDK.RemoteObject.RemoteObject>}
 */
export const resolveThisObject = async (callFrame) => {
    if (!callFrame) {
        return null;
    }
    const scopeChain = callFrame.scopeChain();
    if (scopeChain.length === 0) {
        return callFrame.thisObject();
    }
    const namesMapping = await resolveScope(scopeChain[0]);
    const thisMappings = Platform.MapUtilities.inverse(namesMapping).get('this');
    if (!thisMappings || thisMappings.size !== 1) {
        return callFrame.thisObject();
    }
    const [expression] = thisMappings.values();
    const result = await callFrame.evaluate(/** @type {!SDK.RuntimeModel.EvaluationOptions} */ ({
        expression,
        objectGroup: 'backtrace',
        includeCommandLineAPI: false,
        silent: true,
        returnByValue: false,
        generatePreview: true
    }));
    if ('exceptionDetails' in result) {
        return !result.exceptionDetails && result.object ? result.object : callFrame.thisObject();
    }
    return null;
};
/**
 * @param {!SDK.DebuggerModel.ScopeChainEntry} scope
 * @return {!SDK.RemoteObject.RemoteObject}
 */
export const resolveScopeInObject = function (scope) {
    const startLocation = scope.startLocation();
    const endLocation = scope.endLocation();
    const startLocationScript = startLocation ? startLocation.script() : null;
    if (scope.type() === Protocol.Debugger.ScopeType.Global || !startLocationScript || !endLocation ||
        !startLocationScript.sourceMapURL || startLocationScript !== endLocation.script()) {
        return scope.object();
    }
    return new RemoteObject(scope);
};
export class RemoteObject extends SDK.RemoteObject.RemoteObject {
    /**
     * @param {!SDK.DebuggerModel.ScopeChainEntry} scope
     */
    constructor(scope) {
        super();
        this._scope = scope;
        this._object = scope.object();
    }
    /**
     * @override
     * @return {?Protocol.Runtime.CustomPreview}
     */
    customPreview() {
        return this._object.customPreview();
    }
    /**
     * @override
     * @return {!Protocol.Runtime.RemoteObjectId|undefined}
     */
    get objectId() {
        return this._object.objectId;
    }
    /**
     * @override
     * @return {string}
     */
    get type() {
        return this._object.type;
    }
    /**
     * @override
     * @return {string|undefined}
     */
    get subtype() {
        return this._object.subtype;
    }
    /**
     * @override
     * @return {*}
     */
    get value() {
        return this._object.value;
    }
    /**
     * @override
     * @return {string|undefined}
     */
    get description() {
        return this._object.description;
    }
    /**
     * @override
     * @return {boolean}
     */
    get hasChildren() {
        return this._object.hasChildren;
    }
    /**
     * @override
     * @return {!Protocol.Runtime.ObjectPreview|undefined}
     */
    get preview() {
        return this._object.preview;
    }
    /**
     * @override
     * @return {number}
     */
    arrayLength() {
        return this._object.arrayLength();
    }
    /**
     * @override
     * @param {boolean} generatePreview
     */
    getOwnProperties(generatePreview) {
        return this._object.getOwnProperties(generatePreview);
    }
    /**
     * @override
     * @param {boolean} accessorPropertiesOnly
     * @param {boolean} generatePreview
     * @return {!Promise<!SDK.RemoteObject.GetPropertiesResult>}
     */
    async getAllProperties(accessorPropertiesOnly, generatePreview) {
        const allProperties = await this._object.getAllProperties(accessorPropertiesOnly, generatePreview);
        const namesMapping = await resolveScope(this._scope);
        const properties = allProperties.properties;
        const internalProperties = allProperties.internalProperties;
        const newProperties = [];
        if (properties) {
            for (let i = 0; i < properties.length; ++i) {
                const property = properties[i];
                const name = namesMapping.get(property.name) || properties[i].name;
                if (!property.value) {
                    continue;
                }
                newProperties.push(new SDK.RemoteObject.RemoteObjectProperty(name, property.value, property.enumerable, property.writable, property.isOwn, property.wasThrown, property.symbol, property.synthetic));
            }
        }
        return { properties: newProperties, internalProperties: internalProperties };
    }
    /**
     * @override
     * @param {string|!Protocol.Runtime.CallArgument} argumentName
     * @param {string} value
     * @return {!Promise<string|undefined>}
     */
    async setPropertyValue(argumentName, value) {
        const namesMapping = await resolveScope(this._scope);
        let name;
        if (typeof argumentName === 'string') {
            name = argumentName;
        }
        else {
            name = /** @type {string} */ (argumentName.value);
        }
        let actualName = name;
        for (const compiledName of namesMapping.keys()) {
            if (namesMapping.get(compiledName) === name) {
                actualName = compiledName;
                break;
            }
        }
        return this._object.setPropertyValue(actualName, value);
    }
    /**
     * @override
     * @param {!Protocol.Runtime.CallArgument} name
     * @return {!Promise<string|undefined>}
     */
    async deleteProperty(name) {
        return this._object.deleteProperty(name);
    }
    /**
     * @override
     * @param {function(this:Object, ...?):T} functionDeclaration
     * @param {!Array<!Protocol.Runtime.CallArgument>=} args
     * @return {!Promise<!SDK.RemoteObject.CallFunctionResult>}
     * @template T
     */
    callFunction(functionDeclaration, args) {
        return this._object.callFunction(functionDeclaration, args);
    }
    /**
     * @override
     * @param {function(this:Object, ...?):T} functionDeclaration
     * @param {!Array<!Protocol.Runtime.CallArgument>|undefined} args
     * @return {!Promise<T>}
     * @template T
     */
    callFunctionJSON(functionDeclaration, args) {
        return this._object.callFunctionJSON(functionDeclaration, args);
    }
    /**
     * @override
     */
    release() {
        this._object.release();
    }
    /**
     * @override
     * @return {!SDK.DebuggerModel.DebuggerModel}
     */
    debuggerModel() {
        return this._object.debuggerModel();
    }
    /**
     * @override
     * @return {!SDK.RuntimeModel.RuntimeModel}
     */
    runtimeModel() {
        return this._object.runtimeModel();
    }
    /**
     * @override
     * @return {boolean}
     */
    isNode() {
        return this._object.isNode();
    }
}
/**
 * @type {function(...*):*} scope
 */
let _scopeResolvedForTest = function () { };
/**
 * @return {function(...*):*} scope
 */
export const getScopeResolvedForTest = () => {
    return _scopeResolvedForTest;
};
/**
 * @param {function(...*):*} scope
 */
export const setScopeResolvedForTest = scope => {
    _scopeResolvedForTest = scope;
};
//# sourceMappingURL=SourceMapNamesResolver.js.map