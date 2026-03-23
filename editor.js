class VSCodeEditorInstance {
    constructor(container, options) {
        this.container = container;
        this.initialValue = options.value || "\n<h1>Hello World</h1>";
        
        this.buildUI();
        this.bindEvents();
        
        this.textarea.value = this.initialValue;
        this.update();
    }

    buildUI() {
        this.container.innerHTML = `
            <div class="micro-ide-wrapper">
                <div class="tab-bar">
                    <div class="ide-tab active" id="tab-code">index.html</div>
                    <div class="ide-tab" id="tab-preview">Web Preview</div>
                </div>
                <div class="workspace">
                    <div id="code-area">
                        <div class="lines" id="editor-lines">1</div>
                        <pre class="highlight" id="editor-highlight"></pre>
                        <textarea class="input" id="editor-input" spellcheck="false"></textarea>
                    </div>
                    <iframe id="preview-area"></iframe>
                </div>
            </div>
        `;

        this.tabCode = this.container.querySelector('#tab-code');
        this.tabPreview = this.container.querySelector('#tab-preview');
        this.codeArea = this.container.querySelector('#code-area');
        this.previewArea = this.container.querySelector('#preview-area');
        this.textarea = this.container.querySelector('#editor-input');
        this.highlightPre = this.container.querySelector('#editor-highlight');
        this.linesDiv = this.container.querySelector('#editor-lines');
    }

    bindEvents() {
        // Tab Switching - WITH PROPER EXECUTION
        this.tabCode.onclick = () => {
            this.codeArea.style.display = 'flex';
            this.previewArea.style.display = 'none';
            this.tabCode.classList.add('active');
            this.tabPreview.classList.remove('active');
        };

        this.tabPreview.onclick = () => {
            this.codeArea.style.display = 'none';
            this.previewArea.style.display = 'block';
            this.tabPreview.classList.add('active');
            this.tabCode.classList.remove('active');
            
            // This is the fix to actually execute the tags and JS
            const doc = this.previewArea.contentWindow.document;
            doc.open();
            doc.write(this.textarea.value);
            doc.close();
        };

        // Editor Typing & Syncing
        this.textarea.addEventListener('input', () => this.update());
        this.textarea.addEventListener('scroll', () => {
            this.highlightPre.scrollTop = this.textarea.scrollTop;
            this.highlightPre.scrollLeft = this.textarea.scrollLeft;
            this.linesDiv.scrollTop = this.textarea.scrollTop;
        });
        
        // Tab Key Support
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                this.textarea.value = this.textarea.value.substring(0, start) + "    " + this.textarea.value.substring(end);
                this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
                this.update();
            }
        });
    }

    update() {
        const text = this.textarea.value;
        const lineCount = text.split('\n').length;
        this.linesDiv.innerHTML = Array.from({length: lineCount}, (_, i) => i + 1).join('<br>');

        // Better Regex for HTML Syntax Highlighting
        let htmlFormatted = text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/(&lt;\/?)([a-zA-Z0-9\-]+)/g, '<span class="syn-bracket">$1</span><span class="syn-tag">$2</span>')
            .replace(/([a-zA-Z\-]+)=/g, '<span class="syn-attr">$1</span>=')
            .replace(/(["'])(.*?)\1/g, '<span class="syn-string">$&</span>')
            .replace(/&gt;/g, '<span class="syn-bracket">&gt;</span>');

        this.highlightPre.innerHTML = htmlFormatted;
    }
}

// Global exposure for the user
window.MicroEditor = {
    create: function(containerElement, options = {}) {
        return new VSCodeEditorInstance(containerElement, options);
    }
};
