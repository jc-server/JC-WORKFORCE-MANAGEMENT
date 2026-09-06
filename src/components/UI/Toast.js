export class Toast {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.defaultDuration = 5000;
    }

    show(message, type = 'info', duration = this.defaultDuration) {
        if (!this.container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close toast">×</button>
        `;
        
        this.container.appendChild(toast);
        
        // Auto-close
        const timeout = setTimeout(() => {
            this.close(toast);
        }, duration);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            this.close(toast);
        });
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            clearTimeout(timeout);
            this.close(toast);
        });
        
        return toast;
    }

    close(toast) {
        if (toast && toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}