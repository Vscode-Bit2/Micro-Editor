// ==========================================
// MICRO-EDITOR: PART 1 - CORE & STATE
// ==========================================

class LightningEngine {
    constructor(containerId) {
        // 1. Core Initialization
        this.root = document.getElementById(containerId);
        if (!this.root) {
            console.error("LightningEngine: Container ID not found. Ensure your div exists.");
            return;
        }

        // 2. Virtual File System (VFS)
        // This stores multiple files in memory so tabs actually work
        this.vfs = {
            'index.html': {
                language: 'html',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="glass-panel">
        <h1>Micro Editor</h1>
        <p>Virtual File System Active</p>
    </div>
    <script src="script.js"><\/script>
</body>
</html>`
            },
            'style.css': {
                language: 'css',
                content: `/* Liquid Glass Aesthetic */
body { background: #0d1117; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.glass-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(15px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}`
            },
            'script.js': {
                language: 'javascript',
                content: `// Interaction Logic
console.log("Engine initialized.");
document.querySelector('.glass-panel').addEventListener('click', () => {
    alert('Liquid glass UI is active!');
});`
            }
        };

        // 3. State Tracking
        this.activeFileName = 'index.html';
        this.viewMode = 'code'; // 'code' or 'preview'
        
        // 4. Boot Sequence
        this.buildBaseUI();
        this.cacheDOM();
        this.bindCoreEvents();
        this.loadFile(this.activeFileName);
    }

    // --- DOM GENERATION ---

    buildBaseUI() {
        // We inject the entire VS Code layout directly into the container
        this.root.innerHTML = `
            <div class="lightning-ide">
                <div class="sidebar">
                    <div class="sidebar-header">EXPLORER</div>
                    <div id="file-tree">
                        </div>
                </div>
                <div class="main-panel">
                    <div class="tabs">
                        <div class="tab active" id="tab-code-view">
                            <span id="active-tab-name">index.html</span>
                        </div>
                        <div class="tab" id="tab-preview-view">Web Preview</div>
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

    cacheDOM() {
        this.input = document.getElementById('core-input');
        this.highlighter = document.getElementById('highlighter');
        this.lines = document.getElementById('lines');
        this.fileTree = document.getElementById('file-tree');
        this.tabCodeView = document.getElementById('tab-code-view');
        this.tabPreviewView = document.getElementById('tab-preview-view');
        this.activeTabName = document.getElementById('active-tab-name');
        this.editorView = document.getElementById('editor-view');
        this.previewView = document.getElementById('preview-view');
    }

    // --- STATE MANAGEMENT ---

    bindCoreEvents() {
        this.renderFileTree();
        
        // Save code to memory on typing
        this.input.addEventListener('input', () => {
            this.vfs[this.activeFileName].content = this.input.value;
            // updateSyntax() will be added in Part 2
            if(typeof this.updateSyntax === 'function') this.updateSyntax(); 
        });

        // Tab Switching
        this.tabCodeView.onclick = () => this.switchMode('code');
        this.tabPreviewView.onclick = () => this.switchMode('preview');
    }

    renderFileTree() {
        this.fileTree.innerHTML = '';
        Object.keys(this.vfs).forEach(fileName => {
            const el = document.createElement('div');
            el.className = \`file-item \${fileName === this.activeFileName ? 'active' : ''}\`;
            el.innerText = fileName;
            el.onclick = () => this.loadFile(fileName);
            this.fileTree.appendChild(el);
        });
    }

    loadFile(fileName) {
        // Save current state just in case
        if (this.vfs[this.activeFileName]) {
            this.vfs[this.activeFileName].content = this.input.value;
        }

        // Switch active file
        this.activeFileName = fileName;
        this.activeTabName.innerText = fileName;
        
        // Load new content
        this.input.value = this.vfs[fileName].content;
        
        this.renderFileTree();
        this.switchMode('code');
        
        // Will be called when Part 2 is loaded
        if(typeof this.updateSyntax === 'function') this.updateSyntax();
    }

    switchMode(mode) {
        this.viewMode = mode;
        if (mode === 'code') {
            this.editorView.style.display = 'flex';
            this.previewView.style.display = 'none';
            this.tabCodeView.classList.add('active');
            this.tabPreviewView.classList.remove('active');
        } else {
            this.editorView.style.display = 'none';
            this.previewView.style.display = 'block';
            this.tabPreviewView.classList.add('active');
            this.tabCodeView.classList.remove('active');
            
            // Preview Compiler will be built in Part 3
            if(typeof this.compilePreview === 'function') this.compilePreview();
        }
    }
}
// ==========================================
// MICRO-EDITOR: PART 2 - SYNTAX & EMMET ENGINE
// Paste this directly below Part 1
// ==========================================

Object.assign(LightningEngine.prototype, {

    // --- KEYBOARD & TYPING MECHANICS ---

    bindCoreEvents() {
        // Overriding the placeholder from Part 1 with the real events
        this.renderFileTree();
        
        this.input.addEventListener('input', () => {
            this.vfs[this.activeFileName].content = this.input.value;
            this.updateSyntax(); 
        });

        this.input.addEventListener('scroll', () => this.syncScroll());
        this.input.addEventListener('keydown', (e) => this.handleKeystrokes(e));

        this.tabCodeView.onclick = () => this.switchMode('code');
        this.tabPreviewView.onclick = () => this.switchMode('preview');
    },

    syncScroll() {
        // Pixel-perfect sync between invisible textarea and syntax layer
        this.highlighter.scrollTop = this.input.scrollTop;
        this.highlighter.scrollLeft = this.input.scrollLeft;
        this.lines.scrollTop = this.input.scrollTop;
    },

    handleKeystrokes(e) {
        const val = this.input.value;
        let start = this.input.selectionStart;
        
        // 1. Emmet Expansion & Tab Indent
        if (e.key === 'Tab') {
            e.preventDefault();
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            const currentLineToCursor = val.substring(lineStart, start);
            
            // Check if it's an Emmet abbreviation (e.g., div.container>p)
            const abbrMatch = currentLineToCursor.match(/([a-zA-Z0-9\.\#\>\*]+)$/);
            const language = this.vfs[this.activeFileName].language;
            
            if (language === 'html' && abbrMatch && this.isValidAbbr(abbrMatch[1])) {
                const abbr = abbrMatch[1];
                const expanded = this.expandAbbreviation(abbr);
                this.insertText(expanded, start - abbr.length, start);
                // Smart cursor placement inside the first tag
                this.input.selectionStart = this.input.selectionEnd = (start - abbr.length) + expanded.indexOf('><') + 1;
            } else {
                this.insertText("    "); // Fallback to 4-space indent
            }
        }

        // 2. Smart Brackets & Quotes
        const pairs = { '{': '}', '[': ']', '(': ')', '"': '"', "'": "'", '`': '`' };
        if (pairs[e.key]) {
            e.preventDefault();
            this.insertText(e.key + pairs[e.key]);
            this.input.selectionStart = this.input.selectionEnd = start + 1;
        }

        // 3. Smart Enter (Auto-Indent & Tag Splitting)
        if (e.key === 'Enter') {
            e.preventDefault();
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            const currentLine = val.substring(lineStart, start);
            const indentMatch = currentLine.match(/^\s*/);
            let indent = indentMatch ? indentMatch[0] : "";

            // If pressing enter between <div> and </div> or { and }
            if ((val[start - 1] === '>' && val[start] === '<' && val[start+1] === '/') || 
                (val[start - 1] === '{' && val[start] === '}')) {
                this.insertText('\n' + indent + '    \n' + indent);
                this.input.selectionStart = this.input.selectionEnd = start + indent.length + 5;
            } else {
                this.insertText('\n' + indent); // Carry over previous indent
            }
        }
    },

    insertText(text, replaceStart = this.input.selectionStart, replaceEnd = this.input.selectionEnd) {
        this.input.value = this.input.value.substring(0, replaceStart) + text + this.input.value.substring(replaceEnd);
        this.input.selectionStart = this.input.selectionEnd = replaceStart + text.length;
        this.vfs[this.activeFileName].content = this.input.value;
        this.updateSyntax();
    },

    // --- EMMET PARSER ENGINE ---

    isValidAbbr(str) {
        // Prevent expanding JS variables like "const" or "let"
        return /^[a-z]+[a-z0-9\.\#\>\*]*$/.test(str) && !['const', 'let', 'var', 'function', 'return'].includes(str);
    },

    expandAbbreviation(abbr) {
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
            
            if (index === 0) {
                result = block.repeat(count);
            } else {
                // Nested injection
                const prevTag = parts[index-1].split(/[\.\#\*]/)[0] || 'div';
                const regex = new RegExp(`</${prevTag}>`, 'g');
                result = result.replace(regex, `\n    ${block.repeat(count)}\n</${prevTag}>`);
            }
        });
        return result;
    },

    // --- MULTI-LANGUAGE SYNTAX HIGHLIGHTER ---

    updateSyntax() {
        if (!this.input || !this.highlighter || !this.lines) return;
        
        const text = this.input.value;
        const language = this.vfs[this.activeFileName].language;
        
        // 1. Update Lines
        const lineCount = text.split('\n').length;
        this.lines.innerHTML = Array.from({length: lineCount}, (_, i) => i + 1).join('<br>');

        // 2. Escape HTML to prevent accidental DOM injection
        let formatted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // 3. Apply Language-Specific Regex Rules
        if (language === 'html') {
            formatted = formatted
                .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tk-comment">$1</span>')
                .replace(/(&lt;\/?)([a-zA-Z0-9\-]+)/g, '<span class="tk-bracket">$1</span><span class="tk-tag">$2</span>')
                .replace(/([a-zA-Z\-]+)=/g, '<span class="tk-attr">$1</span>=')
                .replace(/(["'])(.*?)\1/g, '<span class="tk-str">$&</span>')
                .replace(/&gt;/g, '<span class="tk-bracket">&gt;</span>');
        } 
        else if (language === 'css') {
            formatted = formatted
                .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tk-comment">$1</span>')
                .replace(/([\.#]?[a-zA-Z0-9\-]+)(?=\s*\{)/g, '<span class="tk-tag">$1</span>') // Selectors
                .replace(/([a-zA-Z\-]+)(?=\s*:)/g, '<span class="tk-attr">$1</span>') // Properties
                .replace(/:\s*([^;]+);/g, ': <span class="tk-str">$1</span>;') // Values
                .replace(/px|em|rem|vh|vw|%/g, '<span class="tk-kw">$&</span>'); // Units
        }
        else if (language === 'javascript') {
            formatted = formatted
                .replace(/(\/\/.*?$|\/\*[\s\S]*?\*\/)/gm, '<span class="tk-comment">$1</span>')
                .replace(/(["'`])(.*?)\1/g, '<span class="tk-str">$&</span>')
                .replace(/\b(function|const|let|var|if|else|return|class|new|import|export|from|await|async|=>)\b/g, '<span class="tk-kw">$1</span>')
                .replace(/\b(document|window|console|Math|Object|Array|String|this)\b/g, '<span class="tk-tag">$1</span>')
                .replace(/([a-zA-Z0-9_]+)(?=\s*\()/g, '<span class="tk-attr">$1</span>'); // Functions
        }

        // 4. Inject into the invisible display layer
        this.highlighter.innerHTML = formatted;
    }
});

