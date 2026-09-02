// AttendanceTable Component
export class AttendanceTable {
    render(state) {
        const today = new Date().toISOString().slice(0, 10);
        const workers = state.workers.filter(w => w.active !== false);
        
        if (workers.length === 0) {
            return `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title"><i class="fas fa-clipboard-check"></i> Daily Attendance & Payments</div>
                    </div>
                    <div class="empty-state">
                        <i class="fas fa-clipboard-check"></i>
                        <h3>No workers to mark attendance</h3>
                        <p>Add workers first to start tracking attendance</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title"><i class="fas fa-clipboard-check"></i> Daily Attendance & Payments</div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Worker</th>
                                <th>Status</th>
                                <th>Wage Rate</th>
                                <th>Paid (₹)</th>
                                <th>Day Balance</th>
                                <th>Total Wage</th>
                                <th>Total Paid</th>
                                <th>Net Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workers.map(worker => {
                                const todayAtt = state.attendance.find(a => 
                                    a.worker_id === worker.id && a.work_date === today
                                );
                                const status = todayAtt ? todayAtt.status : '';
                                const wageRate = worker.daily_rate || 0;
                                const paid = todayAtt ? todayAtt.payment_amount : 0;
                                
                                // Calculate total wage, paid, and balance
                                const workerAtt = state.attendance.filter(a => a.worker_id === worker.id);
                                const totalWage = workerAtt.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
                                const totalPaid = state.transactions
                                    ?.filter(t => t.worker_id === worker.id && t.transaction_type === 'payment')
                                    .reduce((sum, t) => sum + t.amount, 0) || 0;
                                const totalAdvance = state.transactions
                                    ?.filter(t => t.worker_id === worker.id && t.transaction_type === 'advance')
                                    .reduce((sum, t) => sum + t.amount, 0) || 0;
                                const netBalance = totalWage - totalPaid - totalAdvance;
                                
                                const dayBalance = wageRate - paid;
                                
                                return `
                                    <tr>
                                        <td>
                                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                                <i class="fas fa-user-circle" style="color:#fbbf24;"></i>
                                                <strong>${this.escapeHtml(worker.name)}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="attendance-btn-group">
                                                ${['present', 'absent', 'half-day'].map(s => `
                                                    <button class="attendance-btn attendance-btn-${s} ${status === s ? 'active' : ''}" 
                                                            data-action="setAttendance" 
                                                            data-worker="${worker.id}" 
                                                            data-date="${today}" 
                                                            data-status="${s}"
                                                            title="${s === 'present' ? 'Present' : s === 'absent' ? 'Absent' : 'Half Day'}">
                                                        ${s === 'present' ? 'P' : s === 'absent' ? 'A' : '½'}
                                                    </button>
                                                `).join('')}
                                            </div>
                                            ${status === 'absent' ? '<div style="font-size:0.7rem; color:#f87171; text-align:center;">No Work</div>' : ''}
                                        </td>
                                        <td>₹${wageRate.toLocaleString()}</td>
                                        <td>
                                            <input type="number" class="form-control" 
                                                   style="width:80px; padding:0.25rem;" 
                                                   value="${paid}" 
                                                   step="0.01" 
                                                   min="0"
                                                   data-action="paymentInput"
                                                   data-worker="${worker.id}"
                                                   data-date="${today}">
                                        </td>
                                        <td style="color:${dayBalance >= 0 ? '#4ade80' : '#f87171'};">
                                            ₹${dayBalance.toLocaleString()}
                                        </td>
                                        <td>₹${totalWage.toLocaleString()}</td>
                                        <td>₹${totalPaid.toLocaleString()}</td>
                                        <td style="color:${netBalance >= 0 ? '#4ade80' : '#f87171'};">
                                            ₹${netBalance.toLocaleString()}
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-info" data-action="viewWorker" data-id="${worker.id}">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-sm btn-warning" data-action="advanceWorker" data-id="${worker.id}">
                                                <i class="fas fa-money-bill-wave"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
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
        // Attendance buttons
        document.querySelectorAll('[data-action="setAttendance"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workerId = e.currentTarget.dataset.worker;
                const date = e.currentTarget.dataset.date;
                const status = e.currentTarget.dataset.status;
                
                // Get current payment input value
                const paymentInput = document.querySelector(`[data-action="paymentInput"][data-worker="${workerId}"][data-date="${date}"]`);
                const paymentAmount = paymentInput ? parseFloat(paymentInput.value) || 0 : 0;
                
                app.setAttendance(workerId, status, date, paymentAmount);
            });
        });
        
        // Payment input changes
        document.querySelectorAll('[data-action="paymentInput"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const workerId = e.currentTarget.dataset.worker;
                const date = e.currentTarget.dataset.date;
                const paymentAmount = parseFloat(e.currentTarget.value) || 0;
                
                // Update payment                app.updatePayment(workerId, date, paymentAmount);
            });
        });
        
        // View Worker Profile
        document.querySelectorAll('[data-action="viewWorker"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                app.showWorkerProfile(id);
            });
        });
        
        // Advance Worker
        document.querySelectorAll('[data-action="advanceWorker"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                app.showAdvanceModal(id);
            });
        });
    }
}
