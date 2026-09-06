import { formatCurrency } from '../utils/money.js';

export class WorkerProfileModal {
    render(worker, state, viewMonth = null) {
        if (!worker) return '';
        
        const month = viewMonth || new Date().toISOString().slice(0, 7);
        const [year, mon] = month.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();
        
        // Filter attendance for this worker and month
        const workerAttendance = state.attendance.filter(a => 
            a.worker_id === worker.id && 
            a.work_date.startsWith(month)
        );
        
        // Calculate financial summary
        const totalWages = state.attendance
            .filter(a => a.worker_id === worker.id)
            .reduce((sum, a) => sum + (a.wage_amount || 0), 0);
        
        const totalPaid = state.transactions
            ?.filter(t => t.worker_id === worker.id && t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0) || 0;
        
        const totalAdvances = state.transactions
            ?.filter(t => t.worker_id === worker.id && t.transaction_type === 'advance')
            .reduce((sum, t) => sum + t.amount, 0) || 0;
        
        const netBalance = totalWages - totalPaid - totalAdvances;
        
        return `
            <div class="modal-overlay" id="workerProfileModal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fas fa-user"></i> ${this.escapeHtml(worker.name)}
                            <span class="badge badge-secondary">${this.escapeHtml(worker.role || 'Worker')}</span>
                        </div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    
                    <!-- Worker Info -->
                    <div class="worker-profile-info">
                        <div class="worker-profile-field">
                            <label>Daily Rate</label>
                            <div class="value">${formatCurrency(worker.daily_rate)}</div>
                        </div>
                        <div class="worker-profile-field">
                            <label>Monthly Wages</label>
                            <div class="value">${formatCurrency(totalWages)}</div>
                        </div>
                        <div class="worker-profile-field">
                            <label>Total Paid</label>
                            <div class="value">${formatCurrency(totalPaid)}</div>
                        </div>
                        <div class="worker-profile-field">
                            <label>Advances</label>
                            <div class="value">${formatCurrency(totalAdvances)}</div>
                        </div>
                        <div class="worker-profile-field">
                            <label>Net Balance</label>
                            <div class="value" style="color: ${netBalance >= 0 ? '#4ade80' : '#f87171'};">
                                ${formatCurrency(netBalance)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Month Navigation -->
                    <div class="calendar-nav">
                        <button class="btn btn-secondary btn-sm" onclick="window.__app.navigateWorkerMonth('${worker.id}', '${this.getPrevMonth(month)}')">
                            <i class="fas fa-chevron-left"></i> Prev
                        </button>
                        <h3 class="calendar-month">${this.getMonthName(month)}</h3>
                        <button class="btn btn-secondary btn-sm" onclick="window.__app.navigateWorkerMonth('${worker.id}', '${this.getNextMonth(month)}')">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <!-- Monthly Calendar -->
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Day</th>
                                    <th>Status</th>
                                    <th>Wage</th>
                                    <th>Payment</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.getCalendarDays(month, worker.id, workerAttendance)}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                        <button class="btn btn-warning" onclick="window.__app.showAdvanceModal('${worker.id}')">
                            <i class="fas fa-money-bill-wave"></i> Issue Advance
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getCalendarDays(month, workerId, attendance) {
        const [year, mon] = month.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();
        let html = '';
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${month}-${String(d).padStart(2, '0')}`;
            const date = new Date(year, mon - 1, d);
            const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
            
            const att = attendance.find(a => a.work_date === dateStr);
            const status = att ? att.status : '';
            const wage = att ? att.wage_amount : 0;
            const payment = att ? att.payment_amount : 0;
            const remarks = att ? att.notes || '' : '';
            
            html += `
                <tr>
                    <td>${d}</td>
                    <td>${dayName}</td>
                    <td>
                        ${status ? `
                            <span class="badge ${status === 'present' ? 'badge-success' : status === 'absent' ? 'badge-danger' : 'badge-warning'}">
                                ${status === 'present' ? 'P' : status === 'absent' ? 'A' : '½'}
                            </span>
                        ` : '-'}
                    </td>
                    <td>${wage ? formatCurrency(wage) : '-'}</td>
                    <td>${payment ? formatCurrency(payment) : '-'}</td>
                    <td>${this.escapeHtml(remarks) || '-'}</td>
                </tr>
            `;
        }
        return html;
    }

    getMonthName(month) {
        const [year, mon] = month.split('-').map(Number);
        return new Date(year, mon - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    }

    getPrevMonth(month) {
        const [year, mon] = month.split('-').map(Number);
        const prevMon = mon - 1;
        const prevYear = prevMon === 0 ? year - 1 : year;
        const newMon = prevMon === 0 ? 12 : prevMon;
        return `${prevYear}-${String(newMon).padStart(2, '0')}`;
    }

    getNextMonth(month) {
        const [year, mon] = month.split('-').map(Number);
        const nextMon = mon + 1;
        const nextYear = nextMon === 13 ? year + 1 : year;
        const newMon = nextMon === 13 ? 1 : nextMon;
        return `${nextYear}-${String(newMon).padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}
