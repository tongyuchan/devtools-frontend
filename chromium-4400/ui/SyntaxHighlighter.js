/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
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
import * as Root from '../root/root.js'; // eslint-disable-line no-unused-vars
import * as TextUtils from '../text_utils/text_utils.js';
import { createTextChild } from './UIUtils.js';
export class SyntaxHighlighter {
    /**
     * @param {string} mimeType
     * @param {boolean} stripExtraWhitespace
     */
    constructor(mimeType, stripExtraWhitespace) {
        this._mimeType = mimeType;
        this._stripExtraWhitespace = stripExtraWhitespace;
    }
    /**
     * @param {string} content
     * @param {string} className
     * @return {!Element}
     */
    createSpan(content, className) {
        const span = document.createElement('span');
        span.className = className.replace(/\S+/g, 'cm-$&');
        if (this._stripExtraWhitespace && className !== 'whitespace') {
            content = content.replace(/^[\n\r]*/, '').replace(/\s*$/, '');
        }
        createTextChild(span, content);
        return span;
    }
    /**
     * @param {!Element} node
     * @return {!Promise.<void>}
     */
    syntaxHighlightNode(node) {
        const lines = node.textContent ? node.textContent.split('\n') : [];
        /** @type {number} */
        let plainTextStart;
        /** @type {string} */
        let line;
        const extension = Root.Runtime.Runtime.instance().extension(TextUtils.TextUtils.TokenizerFactory);
        if (extension) {
            return extension.instance().then(factory => processTokens.call(this, /** @type {!TextUtils.TextUtils.TokenizerFactory} */ (factory)));
        }
        return Promise.resolve();
        /**
         * @param {!TextUtils.TextUtils.TokenizerFactory} tokenizerFactory
         * @this {SyntaxHighlighter}
         */
        function processTokens(tokenizerFactory) {
            node.removeChildren();
            const tokenize = tokenizerFactory.createTokenizer(this._mimeType);
            for (let i = 0; i < lines.length; ++i) {
                line = lines[i];
                plainTextStart = 0;
                tokenize(line, processToken.bind(this));
                if (plainTextStart < line.length) {
                    const plainText = line.substring(plainTextStart, line.length);
                    createTextChild(node, plainText);
                }
                if (i < lines.length - 1) {
                    createTextChild(node, '\n');
                }
            }
        }
        /**
         * @param {string} token
         * @param {?string} tokenType
         * @param {number} column
         * @param {number} newColumn
         * @this {SyntaxHighlighter}
         */
        function processToken(token, tokenType, column, newColumn) {
            if (!tokenType) {
                return;
            }
            if (column > plainTextStart) {
                const plainText = line.substring(plainTextStart, column);
                createTextChild(node, plainText);
            }
            node.appendChild(this.createSpan(token, tokenType));
            plainTextStart = newColumn;
        }
    }
}
//# sourceMappingURL=SyntaxHighlighter.js.map