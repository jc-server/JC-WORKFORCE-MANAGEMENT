// WorkerTable Component
export class WorkerTable {
    render(state) {
        const workers = state.workers.filter(w => w.active !== false);
        
        if (workers.length === 0) {
            return `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title"><i class="fas fa-users"></i> Manage Workers</div>
                        <button class="btn btn-primary" data-action="addWorker">
                            <i class="fas fa-plus"></i> Add Worker
                        </button>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No workers yet</h3>
                        <p>Add your first worker to start tracking</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-users"></i> Manage Workers</div>
                    <button class="btn btn-primary" data-action="addWorker">
                        <i class="fas fa-plus"></i> Add Worker
                    </button>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Worker</th>
                                <th>Role</th>
                                <th>Daily Rate</th>
                                <th>Advance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workers.map(w => `
                                <tr>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:0.5rem;">
                                            <i class="fas fa-user-circle" style="color:#fbbf24;"></i>
                                            <strong>${this.escapeHtml(w.name)}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge badge-secondary">${this.escapeHtml(w.role || 'Worker')}</span>
                                    </td>
                                    <td>₹${(w.daily_rate || 0).toLocaleString()}</td>
                                    <td>₹${(w.current_advance || 0).toLocaleString()}</td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary" data-action="editWorker" data-id="${w.id}">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-sm btn-danger" data-action="deleteWorker" data-id="${w.id}">
                                            <i class="fas fa-trash"></i> Delete
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
        div.textContent = text || '';
        return div.innerHTML;
    }

    attachEvents(app) {
        // Add Worker
        document.querySelector('[data-action="addWorker"]')?.addEventListener('click', () => {
            app.showAddWorkerModal();
        });
        
        // Edit Worker
        document.querySelectorAll('[data-action="editWorker"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                app.showEditWorkerModal(id);
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
