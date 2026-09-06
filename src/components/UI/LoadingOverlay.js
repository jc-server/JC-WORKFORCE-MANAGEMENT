export class LoadingOverlay {
    constructor() {
        this.element = null;
        this.count = 0;
    }

    show(message = 'Loading...') {
        this.count++;
        if (this.element) {
            this.updateMessage(message);
            return;
        }
        
        this.element = document.createElement('div');
        this.element.className = 'loading-overlay';
        this.element.id = 'loadingOverlay';
        this.element.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(this.element);
    }

    updateMessage(message) {
        if (this.element) {
            const text = this.element.querySelector('.loading-text');
            if (text) text.textContent = message;
        }
    }

    hide() {
        this.count--;
        if (this.count <= 0) {
            this.count = 0;
            if (this.element) {
                this.element.style.opacity = '0';
                setTimeout(() => {
                    if (this.element && this.element.parentNode) {
                        this.element.remove();
                        this.element = null;
                    }
                }, 300);
            }
        }
    }

    forceHide() {
        this.count = 0;
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}