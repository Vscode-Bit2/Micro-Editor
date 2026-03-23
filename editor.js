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
