export class LoadingOverlay {
    constructor() {
        this.element = null;
    }

    show() {
        if (this.element) return;
        
        this.element = document.createElement('div');
        this.element.className = 'loading-overlay';
        this.element.id = 'loadingOverlay';
        this.element.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Loading...</div>
        `;
        document.body.appendChild(this.element);
    }

    hide() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}