class LightningEngine {
    constructor(containerId) {
        this.root = document.getElementById(containerId);
        this.buildIDE();
        this.cacheElements();
        this.bindEvents();
        
        // Initial State
        this.input.value = "<!DOCTYPE html>\n<html>\n<head>\n    <title>Lightning IDE</title>\n</head>\n<body>\n    \n    \n</body>\n</html>";
        this.updateSyntax();
    }

    buildIDE() {
        this.root.innerHTML = `
            <div class="lightning-ide">
                <div class="sidebar">
                    <div class="sidebar-header">Explorer</div>
                    <div class="file-item active">index.html</div>
                    <div class="file-item">script.js</div>
                </div>
                <div class="main-panel">
                    <div class="tabs">
                        <div class="tab active" id="tab-code">index.html</div>
                        <div class="tab" id="tab-preview">Preview Output</div>
                    </div>
                    <div class="workspace">
                        <div class="editor-container" id="editor-view">
                            <div class="line-numbers" id="lines">1</div>
                            <div class="code-layer">
                                <pre class="syntax-highlighter" id="highlighter"></pre>
                                <textarea class="textarea-input" id="core-input" spellcheck="false" wrap="off"></textarea>
                            </div>
                        </div>
                        <iframe class="preview-container" id="preview-view"></iframe>
                    </div>
                </div>
            </div>
        `;
    }

    cacheElements() {
        this.input = document.getElementById('core-input');
        this.highlighter = document.getElementById('highlighter');
        this.lines = document.getElementById('lines');
        this.tabCode = document.getElementById('tab-code');
        this.tabPreview = document.getElementById('tab-preview');
        this.editorView = document.getElementById('editor-view');
        this.previewView = document.getElementById('preview-view');
    }

    bindEvents() {
        this.input.addEventListener('input', () => this.updateSyntax());
        this.input.addEventListener('scroll', () => this.syncScroll());
        this.input.addEventListener('keydown', (e) => this.handleCoreKeystrokes(e));
        
        this.tabCode.onclick = () => this.switchView('code');
        this.tabPreview.onclick = () => this.switchView('preview');
    }

    // --- CORE MECHANICS ---

    handleCoreKeystrokes(e) {
        const val = this.input.value;
        let start = this.input.selectionStart;
        let end = this.input.selectionEnd;

        // 1. Emmet Expansion & Tab Indent
        if (e.key === 'Tab') {
            e.preventDefault();
            
            // Get text before cursor on current line
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            const currentLineToCursor = val.substring(lineStart, start);
            
            // Check if it looks like an abbreviation (e.g., div>ul>li)
            const abbrMatch = currentLineToCursor.match(/([a-zA-Z0-9\.\#\>\*]+)$/);
            
            if (abbrMatch && this.isValidAbbr(abbrMatch[1])) {
                const abbr = abbrMatch[1];
                const expanded = this.expandAbbreviation(abbr);
                const replaceStart = start - abbr.length;
                
                this.insertText(expanded, replaceStart, start);
                // Move cursor inside the first generated tag
                this.input.selectionStart = this.input.selectionEnd = replaceStart + expanded.indexOf('><') + 1;
            } else {
                // Standard Indent
                this.insertText("    ");
            }
        }

        // 2. Smart Auto-Close Brackets/Tags
        const pairs = { '{': '}', '[': ']', '(': ')', '"': '"', "'": "'" };
        if (pairs[e.key]) {
            e.preventDefault();
            this.insertText(e.key + pairs[e.key]);
            this.input.selectionStart = this.input.selectionEnd = start + 1;
        }

        // 3. Smart Enter (Auto-Indent)
        if (e.key === 'Enter') {
            e.preventDefault();
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            const currentLine = val.substring(lineStart, start);
            const indentMatch = currentLine.match(/^\s*/);
            let indent = indentMatch ? indentMatch[0] : "";

            // If pressing enter between <div> and </div>
            if (val[start - 1] === '>' && val[start] === '<' && val[start+1] === '/') {
                this.insertText('\n' + indent + '    \n' + indent);
                this.input.selectionStart = this.input.selectionEnd = start + indent.length + 5;
            } else {
                this.insertText('\n' + indent);
            }
        }
    }

    insertText(text, replaceStart = this.input.selectionStart, replaceEnd = this.input.selectionEnd) {
        this.input.value = this.input.value.substring(0, replaceStart) + text + this.input.value.substring(replaceEnd);
        this.input.selectionStart = this.input.selectionEnd = replaceStart + text.length;
        this.updateSyntax();
    }

    // --- CUSTOM ABBREVIATION ENGINE (Emmet Alternative) ---
    
    isValidAbbr(str) {
        return /^[a-z]+[a-z0-9\.\#\>\*]*$/.test(str) && !['const', 'let', 'var'].includes(str);
    }

    expandAbbreviation(abbr) {
        // Example parser for: tag.class#id>child*3
        const parts = abbr.split('>');
        let result = "";
        
        parts.forEach((part, index) => {
            let count = 1;
            let tagStr = part;
            
            if (part.includes('*')) {
                const split = part.split('*');
                tagStr = split[0];
                count = parseInt(split[1]) || 1;
            }

            let tag = tagStr.match(/^[a-zA-Z0-9]+/)?.[0] || 'div';
            let classes = tagStr.match(/\.([a-zA-Z0-9\-]+)/g)?.map(c => c.substring(1)).join(' ') || '';
            let id = tagStr.match(/\#([a-zA-Z0-9\-]+)/)?.[1] || '';

            let attrs = "";
            if (classes) attrs += ` class="${classes}"`;
            if (id) attrs += ` id="${id}"`;

            let block = `<${tag}${attrs}></${tag}>`;
            
            // Nested logic (Simplified for space)
            if (index === 0) {
                result = block.repeat(count);
            } else {
                // Insert child into parent
                result = result.replace(new RegExp(`</${parts[index-1].split(/[\.\#\*]/)[0]}>`, 'g'), `\n    ${block.repeat(count)}\n</${parts[index-1].split(/[\.\#\*]/)[0]}>`);
            }
        });
        
        return result;
    }

    // --- SYNTAX & RENDER ENGINE ---

    updateSyntax() {
        const text = this.input.value;
        
        // Update Lines
        const lineCount = text.split('\n').length;
        this.lines.innerHTML = Array.from({length: lineCount}, (_, i) => i + 1).join('<br>');

        // Advanced Tokenizer
        let formatted = text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape
            .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tk-comment">$1</span>') // Comments
            .replace(/(&lt;\/?)([a-zA-Z0-9\-]+)/g, '$1<span class="tk-tag">$2</span>') // Tags
            .replace(/([a-zA-Z\-]+)=/g, '<span class="tk-attr">$1</span>=') // Attributes
            .replace(/(["'])(.*?)\1/g, '<span class="tk-str">$&</span>') // Strings
            .replace(/\b(function|const|let|var|if|else|return|class)\b/g, '<span class="tk-kw">$1</span>'); // JS Keywords

        this.highlighter.innerHTML = formatted;
    }

    syncScroll() {
        this.highlighter.scrollTop = this.input.scrollTop;
        this.highlighter.scrollLeft = this.input.scrollLeft;
        this.lines.scrollTop = this.input.scrollTop;
    }

    switchView(mode) {
        if (mode === 'code') {
            this.editorView.style.display = 'flex';
            this.previewView.style.display = 'none';
            this.tabCode.classList.add('active');
            this.tabPreview.classList.remove('active');
        } else {
            this.editorView.style.display = 'none';
            this.previewView.style.display = 'block';
            this.tabPreview.classList.add('active');
            this.tabCode.classList.remove('active');
            
            // Secure, native iframe execution
            const doc = this.previewView.contentWindow.document;
            doc.open();
            doc.write(this.input.value);
            doc.close();
        }
    }
                                                                   }
