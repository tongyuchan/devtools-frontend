// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';
import * as Workspace from '../workspace/workspace.js';
import { LinearMemoryInspectorPaneImpl } from './LinearMemoryInspectorPane.js';
const LINEAR_MEMORY_INSPECTOR_OBJECT_GROUP = 'linear-memory-inspector';
const MEMORY_TRANSFER_MIN_CHUNK_SIZE = 1000;
export const ACCEPTED_MEMORY_TYPES = ['webassemblymemory', 'typedarray', 'dataview', 'arraybuffer'];
let controllerInstance;
export class RemoteArrayWrapper {
    constructor(array) {
        this.remoteArray = array;
    }
    length() {
        return this.remoteArray.length();
    }
    async getRange(start, end) {
        const newEnd = Math.min(end, this.remoteArray.length());
        if (start < 0 || start > newEnd) {
            console.error(`Requesting invalid range of memory: (${start}, ${end})`);
            return Promise.resolve(new Uint8Array(0));
        }
        const array = await this.extractByteArray(start, newEnd);
        return new Uint8Array(array);
    }
    async extractByteArray(start, end) {
        const promises = [];
        for (let i = start; i < end; ++i) {
            // TODO(kimanh): encode requested range in base64 string.
            promises.push(this.remoteArray.at(i).then(x => x.value));
        }
        return await Promise.all(promises);
    }
}
export async function getUint8ArrayFromObject(obj) {
    const response = await obj.runtimeModel()._agent.invoke_callFunctionOn({
        objectId: obj.objectId,
        functionDeclaration: 'function() { return new Uint8Array(this instanceof ArrayBuffer || this instanceof SharedArrayBuffer ? this : this.buffer); }',
        silent: true,
        // Set object group in order to bind the object lifetime to the linear memory inspector.
        objectGroup: LINEAR_MEMORY_INSPECTOR_OBJECT_GROUP,
    });
    const error = response.getError();
    if (error) {
        throw new Error(`Remote object representing Uint8Array could not be retrieved: ${error}`);
    }
    return obj.runtimeModel().createRemoteObject(response.result);
}
export async function getBufferFromObject(obj) {
    const response = await obj.runtimeModel()._agent.invoke_callFunctionOn({
        objectId: obj.objectId,
        functionDeclaration: 'function() { return this instanceof ArrayBuffer || this instanceof SharedArrayBuffer ? this : this.buffer; }',
        silent: true,
        // Set object group in order to bind the object lifetime to the linear memory inspector.
        objectGroup: LINEAR_MEMORY_INSPECTOR_OBJECT_GROUP,
    });
    const error = response.getError();
    if (error) {
        throw new Error(`Remote object representing ArrayBuffer could not be retrieved: ${error}`);
    }
    return obj.runtimeModel().createRemoteObject(response.result);
}
export async function getBufferIdFromObject(obj) {
    const bufferObj = await getBufferFromObject(obj);
    const properties = await bufferObj.getOwnProperties(false);
    const idProperty = properties.internalProperties?.find(prop => prop.name === '[[ArrayBufferData]]');
    const id = idProperty?.value?.value;
    if (!id) {
        throw new Error('Unable to find backing store id for array buffer');
    }
    return id;
}
export class LinearMemoryInspectorController extends SDK.SDKModel.SDKModelObserver {
    constructor() {
        super();
        this.paneInstance = LinearMemoryInspectorPaneImpl.instance();
        this.bufferIdToRemoteObject = new Map();
        SDK.SDKModel.TargetManager.instance().observeModels(SDK.RuntimeModel.RuntimeModel, this);
        SDK.SDKModel.TargetManager.instance().addModelListener(SDK.DebuggerModel.DebuggerModel, SDK.DebuggerModel.Events.GlobalObjectCleared, this.onGlobalObjectClear, this);
        this.paneInstance.addEventListener('view-closed', this.viewClosed.bind(this));
        SDK.SDKModel.TargetManager.instance().addModelListener(SDK.DebuggerModel.DebuggerModel, SDK.DebuggerModel.Events.DebuggerPaused, this.onDebuggerPause, this);
    }
    static instance() {
        if (controllerInstance) {
            return controllerInstance;
        }
        controllerInstance = new LinearMemoryInspectorController();
        return controllerInstance;
    }
    static async getMemoryForAddress(memoryWrapper, address) {
        // Provide a chunk of memory that covers the address to show and some before and after
        // as 1. the address shown is not necessarily at the beginning of a page and
        // 2. to allow for fewer memory requests.
        const memoryChunkStart = Math.max(0, address - MEMORY_TRANSFER_MIN_CHUNK_SIZE / 2);
        const memoryChunkEnd = memoryChunkStart + MEMORY_TRANSFER_MIN_CHUNK_SIZE;
        const memory = await memoryWrapper.getRange(memoryChunkStart, memoryChunkEnd);
        return { memory: memory, offset: memoryChunkStart };
    }
    static async getMemoryRange(memoryWrapper, start, end) {
        // Check that the requested start is within bounds.
        // If the requested end is larger than the actual
        // memory, it will be automatically capped when
        // requesting the range.
        if (start < 0 || start > end || start >= memoryWrapper.length()) {
            throw new Error('Requested range is out of bounds.');
        }
        const chunkEnd = Math.max(end, start + MEMORY_TRANSFER_MIN_CHUNK_SIZE);
        return await memoryWrapper.getRange(start, chunkEnd);
    }
    async openInspectorView(obj, address) {
        const bufferId = await getBufferIdFromObject(obj);
        if (this.bufferIdToRemoteObject.has(bufferId)) {
            this.paneInstance.reveal(bufferId);
            UI.ViewManager.ViewManager.instance().showView('linear-memory-inspector');
            return;
        }
        const callFrame = UI.Context.Context.instance().flavor(SDK.DebuggerModel.CallFrame);
        if (!callFrame) {
            throw new Error(`Cannot find call frame for ${obj.description}.`);
        }
        const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(callFrame.script.sourceURL);
        if (!uiSourceCode) {
            throw new Error(`Cannot find source code object for source url: ${callFrame.script.sourceURL}`);
        }
        const title = uiSourceCode.displayName();
        const objBoundToLMI = await getUint8ArrayFromObject(obj);
        this.bufferIdToRemoteObject.set(bufferId, objBoundToLMI);
        const remoteArray = new SDK.RemoteObject.RemoteArray(objBoundToLMI);
        const arrayWrapper = new RemoteArrayWrapper(remoteArray);
        this.paneInstance.create(bufferId, title, arrayWrapper, address);
        UI.ViewManager.ViewManager.instance().showView('linear-memory-inspector');
    }
    modelRemoved(model) {
        for (const [bufferId, remoteObject] of this.bufferIdToRemoteObject) {
            if (model === remoteObject.runtimeModel()) {
                this.bufferIdToRemoteObject.delete(bufferId);
                this.paneInstance.close(bufferId);
            }
        }
    }
    onDebuggerPause(event) {
        const debuggerModel = event.data;
        for (const [bufferId, remoteObject] of this.bufferIdToRemoteObject) {
            if (debuggerModel.runtimeModel() === remoteObject.runtimeModel()) {
                this.paneInstance.refreshView(bufferId);
            }
        }
    }
    onGlobalObjectClear(event) {
        const debuggerModel = event.data;
        this.modelRemoved(debuggerModel.runtimeModel());
    }
    viewClosed(event) {
        const bufferId = event.data;
        const remoteObj = this.bufferIdToRemoteObject.get(bufferId);
        if (remoteObj) {
            remoteObj.release();
        }
        this.bufferIdToRemoteObject.delete(event.data);
    }
}
