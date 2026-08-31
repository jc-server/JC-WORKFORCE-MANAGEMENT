import { formatCurrency } from '../utils/money.js';

export class WorkerTable {
    render(state) {
        if (state.workers.length === 0) {
            return `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title"><i class="fas fa-user-plus"></i> Workers</div>
                        <button class="btn btn-primary" data-action="addWorker">
                            <i class="fas fa-plus"></i> Add Worker
                        </button>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No workers yet</h3>
                        <p>Add your first worker to start tracking attendance</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-users"></i> Workers</div>
                    <div>
                        <button class="btn btn-primary" data-action="addWorker">
                            <i class="fas fa-plus"></i> Add Worker
                        </button>
                    </div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Daily Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.workers.map(w => `
                                <tr>
                                    <td><strong>${this.escapeHtml(w.name)}</strong></td>
                                    <td>${this.escapeHtml(w.role || 'Worker')}</td>
                                    <td>${formatCurrency(w.daily_rate)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary" data-action="editWorker" data-id="${w.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" data-action="advanceWorker" data-id="${w.id}">
                                            <i class="fas fa-money-bill-wave"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" data-action="deleteWorker" data-id="${w.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachEvents(app) {
        // Add Worker
        const addBtn = document.querySelector('[data-action="addWorker"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => app.showAddWorkerModal());
        }
        
        // Edit Worker
        document.querySelectorAll('[data-action="editWorker"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                app.showEditWorkerModal(id);
            });
        });
        
        // Advance Worker
        document.querySelectorAll('[data-action="advanceWorker"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                app.showAdvanceModal(id);
            });
        });
        
        // Delete Worker
        document.querySelectorAll('[data-action="deleteWorker"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                app.deleteWorker(id);
            });
        });
    }
}