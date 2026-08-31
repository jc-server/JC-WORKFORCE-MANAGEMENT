import { formatCurrency } from '../utils/money.js';

export class AdvanceModal {
    render(worker) {
        if (!worker) {
            return `
                <div class="modal-overlay" id="modalOverlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="modal-title">Issue Advance</div>
                            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                        </div>
                        <div class="empty-state">
                            <p>Worker not found</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">Issue Advance to ${this.escapeHtml(worker.name)}</div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <form id="advanceForm">
                        <div style="margin-bottom:1rem; padding:1rem; background:#f9fafb; border-radius:0.5rem;">
                            <div style="font-size:0.875rem; color:#6b7280;">Daily Rate: ${formatCurrency(worker.daily_rate)}</div>
                            <div style="font-size:0.875rem; color:#6b7280;">Current Balance: ${formatCurrency(worker.current_balance || 0)}</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Amount (₹) *</label>
                            <input type="number" class="form-control" id="advanceAmount" step="0.01" min="0.01" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <input type="text" class="form-control" id="advanceDescription" placeholder="e.g., Weekly advance">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                            <button type="submit" class="btn btn-warning">
                                <i class="fas fa-money-bill-wave"></i> Issue Advance
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

    attachEvents(app, workerId) {
        const form = document.getElementById('advanceForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('advanceAmount').value);
            const description = document.getElementById('advanceDescription').value.trim();
            
            if (!amount || amount <= 0) {
                showToast('Please enter a valid amount', 'error');
                return;
            }
            
            await app.issueAdvance(workerId, amount, description);
        });
    }
}