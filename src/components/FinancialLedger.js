export class FinancialLedger {
    render(state) {
        const workers = state.workers.filter(w => w.active !== false);
        const transactions = state.transactions || [];
        const attendance = state.attendance || [];
        
        // Summary
        const totalWages = attendance.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
        const totalAdvances = transactions
            .filter(t => t.transaction_type === 'advance')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalPayments = transactions
            .filter(t => t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-coins"></i> Financial Ledger
                    </div>
                    <div class="ledger-actions">
                        <button class="btn btn-primary btn-sm" data-action="issueAdvance">
                            <i class="fas fa-money-bill-wave"></i> Issue Advance
                        </button>
                        <select class="form-control" style="width:auto;" data-action="filterWorker">
                            <option value="all">All Workers</option>
                            ${workers.map(w => `
                                <option value="${w.id}">${w.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="ledger-summary">
                    <div class="summary-item">
                        <span class="label">Total Wages</span>
                        <span class="value">₹${totalWages.toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Total Advances</span>
                        <span class="value" style="color:#f59e0b;">₹${totalAdvances.toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Total Payments</span>
                        <span class="value" style="color:#4ade80;">₹${totalPayments.toLocaleString()}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Net Balance</span>
                        <span class="value" style="color:${state.netBalance >= 0 ? '#4ade80' : '#f87171'};">
                            ₹${state.netBalance.toLocaleString()}
                        </span>
                    </div>
                </div>
                
                <!-- Worker Balances Table -->
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Worker</th>
                                <th>Wages</th>
                                <th>Advances</th>
                                <th>Payments</th>
                                <th>Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workers.map(w => {
                                const balance = state.getWorkerBalance(w.id);
                                return `
                                    <tr>
                                        <td>
                                            <strong>${this.escapeHtml(w.name)}</strong>
                                            <span class="badge badge-secondary">${this.escapeHtml(w.role || 'Worker')}</span>
                                        </td>
                                        <td>₹${balance.wages.toLocaleString()}</td>
                                        <td style="color:#f59e0b;">₹${balance.advances.toLocaleString()}</td>
                                        <td style="color:#4ade80;">₹${balance.payments.toLocaleString()}</td>
                                        <td style="color:${balance.balance >= 0 ? '#4ade80' : '#f87171'}; font-weight:600;">
                                            ₹${balance.balance.toLocaleString()}
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-warning" data-action="advanceWorker" data-id="${w.id}">
                                                <i class="fas fa-money-bill-wave"></i> Advance
                                            </button>
                                            <button class="btn btn-sm btn-info" data-action="viewTransactions" data-id="${w.id}">
                                                <i class="fas fa-list"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- Recent Transactions -->
                <div class="recent-transactions">
                    <h4>Recent Transactions</h4>
                    <div class="transaction-list">
                        ${transactions.slice(0, 10).map(t => {
                            const worker = workers.find(w => w.id === t.worker_id);
                            return `
                                <div class="transaction-item ${t.transaction_type}">
                                    <span class="txn-icon">
                                        <i class="fas ${t.transaction_type === 'advance' ? 'fa-hand-holding-usd' : 
                                            t.transaction_type === 'payment' ? 'fa-hand-holding-heart' : 'fa-coins'}"></i>
                                    </span>
                                    <span class="txn-details">
                                        <span class="txn-worker">${worker ? worker.name : 'Unknown'}</span>
                                        <span class="txn-type">${t.transaction_type}</span>
                                        <span class="txn-amount ${t.transaction_type === 'advance' ? 'negative' : 'positive'}">
                                            ${t.transaction_type === 'advance' ? '-' : '+'}₹${t.amount}
                                        </span>
                                    </span>
                                    <span class="txn-time">${this.formatDate(t.transaction_date)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    attachEvents(app) {
        document.querySelector('[data-action="issueAdvance"]')?.addEventListener('click', () => {
            // Show advance modal with worker selection
            const workers = app.state.get('workers');
            if (workers.length === 0) {
                app.toast.show('No workers available', 'warning');
                return;
            }
            // Default to first worker
            app.showAdvanceModal(workers[0].id);
        });
        
        document.querySelectorAll('[data-action="advanceWorker"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                app.showAdvanceModal(id);
            });
        });
        
        document.querySelectorAll('[data-action="viewTransactions"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                app.showWorkerTransactions(id);
            });
        });
        
        document.querySelector('[data-action="filterWorker"]')?.addEventListener('change', (e) => {
            const workerId = e.target.value;
            app.state.set('selectedWorkerId', workerId === 'all' ? null : workerId);
            app.render();
        });
    }
}