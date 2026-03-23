class MicroEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.buildUI();
        this.bindEvents();
    }

    buildUI() {
        this.container.classList.add('micro-editor-container');
        
        this.linesDiv = document.createElement('div');
        this.linesDiv.className = 'micro-editor-lines';
        this.linesDiv.innerHTML = '1';

        const codeArea = document.createElement('div');
        codeArea.className = 'micro-editor-code-area';

        this.highlightPre = document.createElement('pre');
        this.highlightPre.className = 'micro-editor-highlight';

        this.textarea = document.createElement('textarea');
        this.textarea.className = 'micro-editor-input';
        this.textarea.spellcheck = false;

        codeArea.appendChild(this.highlightPre);
        codeArea.appendChild(this.textarea);
        
        this.container.appendChild(this.linesDiv);
        this.container.appendChild(codeArea);
    }

    bindEvents() {
        this.textarea.addEventListener('input', () => this.update());
        this.textarea.addEventListener('scroll', () => this.syncScroll());
        this.textarea.addEventListener('keydown', (e) => this.handleTabs(e));
    }

    update() {
        const text = this.textarea.value;
        
        // 1. Update Line Numbers
        const lineCount = text.split('\n').length;
        this.linesDiv.innerHTML = Array.from({length: lineCount}, (_, i) => i + 1).join('<br>');

        // 2. Wasm / Syntax Hook
        // To add Wasm, replace the 'highlightText' function call below with your Wasm module call
        // Example: this.highlightPre.innerHTML = myWasmModule.parse(text);
        this.highlightPre.innerHTML = this.highlightText(text);
    }

    syncScroll() {
        this.highlightPre.scrollTop = this.textarea.scrollTop;
        this.highlightPre.scrollLeft = this.textarea.scrollLeft;
        this.linesDiv.scrollTop = this.textarea.scrollTop;
    }

    handleTabs(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            this.textarea.value = this.textarea.value.substring(0, start) + "    " + this.textarea.value.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
            this.update();
        }
    }

    highlightText(text) {
        // Fallback basic JS regex highlighting if Wasm isn't loaded
        return text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/(["'])(.*?)\1/g, '<span class="syntax-string">$&</span>')
            .replace(/\b(function|const|let|var|if|else|return|class)\b/g, '<span class="syntax-keyword">$1</span>');
    }
}

