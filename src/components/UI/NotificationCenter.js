export class NotificationCenter {
    constructor() {
        this.container = document.getElementById('notificationCenter');
        this.notifications = [];
        this.isOpen = false;
        this.setupListeners();
    }

    setupListeners() {
        // Listen for global events
        document.addEventListener('notification:add', (e) => {
            this.addNotification(e.detail);
        });
    }

    addNotification(notification) {
        const id = Date.now();
        this.notifications.unshift({
            id,
            ...notification,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Update badge
        this.updateBadge();
        
        // Show toast for important notifications
        if (notification.priority === 'high') {
            this.showToast(notification);
        }
        
        // Save to localStorage
        this.saveNotifications();
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type || 'info'}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">
                    <i class="fas ${this.getIcon(notification.type)}"></i>
                </span>
                <div class="toast-message">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                </div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-bell';
    }

    updateBadge() {
        const unread = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? 'inline-block' : 'none';
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.render();
        } else {
            this.close();
        }
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="notification-panel">
                <div class="notification-header">
                    <h3>Notifications</h3>
                    <button class="close-btn" onclick="document.querySelector('.notification-panel').remove()">×</button>
                </div>
                <div class="notification-list">
                    ${this.notifications.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-bell-slash"></i>
                            <p>No notifications</p>
                        </div>
                    ` : `
                        ${this.notifications.map(n => `
                            <div class="notification-item ${n.read ? 'read' : 'unread'} ${n.type || 'info'}" 
                                 data-id="${n.id}">
                                <span class="notification-icon">
                                    <i class="fas ${this.getIcon(n.type)}"></i>
                                </span>
                                <div class="notification-content">
                                    <div class="notification-title">${n.title}</div>
                                    <div class="notification-message">${n.message}</div>
                                    <div class="notification-time">${this.formatTime(n.timestamp)}</div>
                                </div>
                                <button class="notification-dismiss" data-id="${n.id}">×</button>
                            </div>
                        `).join('')}
                    `}
                </div>
                ${this.notifications.length > 0 ? `
                    <div class="notification-footer">
                        <button class="btn btn-sm btn-secondary" id="markAllRead">Mark all read</button>
                        <button class="btn btn-sm btn-danger" id="clearAll">Clear all</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Mark as read on click
        this.container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.notification-dismiss')) return;
                const id = parseInt(item.dataset.id);
                this.markAsRead(id);
            });
        });
        
        // Dismiss individual
        this.container.querySelectorAll('.notification-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                this.removeNotification(id);
            });
        });
        
        // Mark all read
        this.container.querySelector('#markAllRead')?.addEventListener('click', () => {
            this.markAllRead();
        });
        
        // Clear all
        this.container.querySelector('#clearAll')?.addEventListener('click', () => {
            this.clearAll();
        });
        
        this.container.style.display = 'block';
    }

    close() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.updateBadge();
            this.saveNotifications();
            this.render();
        }
    }

    markAllRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateBadge();
        this.saveNotifications();
        this.render();
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateBadge();
        this.saveNotifications();
        this.render();
    }

    clearAll() {
        this.notifications = [];
        this.updateBadge();
        this.saveNotifications();
        this.render();
    }

    saveNotifications() {
        try {
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
        } catch (e) {
            console.warn('Could not save notifications:', e);
        }
    }

    formatTime(timestamp) {
        const time = new Date(timestamp);
        const now = new Date();
        const diff = now - time;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return time.toLocaleDateString('en-IN');
    }
}