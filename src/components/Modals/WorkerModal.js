import { formatCurrency } from '../utils/money.js';

export class WorkerModal {
    render(worker = null) {
        const isEdit = !!worker;
        const title = isEdit ? 'Edit Worker' : 'Add Worker';
        const name = worker?.name || '';
        const role = worker?.role || '';
        const dailyRate = worker?.daily_rate || '';
        
        return `
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">${title}</div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <form id="workerForm">
                        <div class="form-group">
                            <label class="form-label">Name *</label>
                            <input type="text" class="form-control" id="workerName" value="${this.escapeHtml(name)}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <input type="text" class="form-control" id="workerRole" value="${this.escapeHtml(role)}" placeholder="e.g., Mason, Carpenter">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Daily Rate (₹) *</label>
                            <input type="number" class="form-control" id="workerDailyRate" value="${dailyRate}" step="0.01" min="0" required>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Add'} Worker
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachEvents(app, workerId = null) {
        const form = document.getElementById('workerForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('workerName').value.trim();
            const role = document.getElementById('workerRole').value.trim();
            const dailyRate = parseFloat(document.getElementById('workerDailyRate').value);
            
            if (!name) {
                showToast('Name is required', 'error');
                return;
            }
            
            if (workerId) {
                await app.updateWorker(workerId, name, role, dailyRate);
            } else {
                await app.addWorker(name, role, dailyRate);
            }
        });
    }
}