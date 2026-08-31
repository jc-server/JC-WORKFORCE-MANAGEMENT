export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const text = document.createElement('span');
    text.textContent = message;
    
    const close = document.createElement('button');
    close.className = 'toast-close';
    close.innerHTML = '×';
    close.onclick = () => toast.remove();
    
    toast.appendChild(text);
    toast.appendChild(close);
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 5000);
}

export function showModal(content) {
    // Remove existing modal
    const existing = document.getElementById('modalOverlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modalOverlay';
    overlay.innerHTML = content;
    
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

export function closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.remove();
}

export function getElementValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : null;
}

export function setElementValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}