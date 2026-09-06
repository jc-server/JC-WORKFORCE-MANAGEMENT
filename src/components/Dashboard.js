export class Dashboard {
    render(state) {
        const summary = state.todaySummary || {};
        const workers = state.workers || [];
        const attendance = state.attendance || [];
        const transactions = state.transactions || [];
        
        const totalWorkers = workers.filter(w => w.active !== false).length;
        const today = new Date().toLocaleDateString('en-IN', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        // Calculate monthly stats
        const currentMonth = state.viewMonth;
        const monthAttendance = attendance.filter(a => a.work_date.startsWith(currentMonth));
        const monthWages = monthAttendance.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
        const monthPayments = transactions
            .filter(t => t.transaction_date.startsWith(currentMonth) && t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0);
        const monthAdvances = transactions
            .filter(t => t.transaction_date.startsWith(currentMonth) && t.transaction_type === 'advance')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Attendance rate
        const totalDays = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
        const presentDays = monthAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / (totalDays * totalWorkers)) * 100) : 0;
        
        return `
            <div class="dashboard-grid">
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card" style="border-left-color: #fbbf24;">
                        <div class="stat-label">
                            <i class="fas fa-users"></i> Total Workers
                        </div>
                        <div class="stat-value">${totalWorkers}</div>
                        <div class="stat-sub">Active workforce</div>
                    </div>
                    <div class="stat-card" style="border-left-color: #4ade80;">
                        <div class="stat-label">
                            <i class="fas fa-user-check"></i> Present Today
                        </div>
                        <div class="stat-value">${summary.present_count || 0}</div>
                        <div class="stat-sub">${totalWorkers > 0 ? Math.round((summary.present_count || 0) / totalWorkers * 100) : 0}% attendance</div>
                    </div>
                    <div class="stat-card" style="border-left-color: #60a5fa;">
                        <div class="stat-label">
                            <i class="fas fa-rupee-sign"></i> Monthly Wages
                        </div>
                        <div class="stat-value">₹${monthWages.toLocaleString()}</div>
                        <div class="stat-sub">${currentMonth}</div>
                    </div>
                    <div class="stat-card" style="border-left-color: #f59e0b;">
                        <div class="stat-label">
                            <i class="fas fa-hand-holding-usd"></i> Monthly Advances
                        </div>
                        <div class="stat-value">₹${monthAdvances.toLocaleString()}</div>
                        <div class="stat-sub">${monthPayments > 0 ? Math.round(monthAdvances / monthPayments * 100) : 0}% of payments</div>
                    </div>
                    <div class="stat-card" style="border-left-color: #22d3ee;">
                        <div class="stat-label">
                            <i class="fas fa-chart-line"></i> Attendance Rate
                        </div>
                        <div class="stat-value">${attendanceRate}%</div>
                        <div class="stat-sub">${presentDays} present days this month</div>
                    </div>
                    <div class="stat-card" style="border-left-color: #a78bfa;">
                        <div class="stat-label">
                            <i class="fas fa-money-bill-wave"></i> Net Balance
                        </div>
                        <div class="stat-value" style="color: ${state.netBalance >= 0 ? '#4ade80' : '#f87171'}">
                            ₹${state.netBalance.toLocaleString()}
                        </div>
                        <div class="stat-sub">Total wages - payments - advances</div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="btn btn-primary" data-action="addWorker">
                        <i class="fas fa-user-plus"></i> Add Worker
                    </button>
                    <button class="btn btn-success" data-action="bulkAttendance">
                        <i class="fas fa-check-double"></i> Bulk Attendance
                    </button>
                    <button class="btn btn-warning" data-action="exportData">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
                
                <!-- Recent Activity -->
                <div class="recent-activity card">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-clock"></i> Recent Activity
                        </div>
                        <span class="badge badge-info">${state.lastSync ? 'Synced: ' + new Date(state.lastSync).toLocaleTimeString() : 'Never'}</span>
                    </div>
                    <div class="activity-list">
                        ${this.getRecentActivity(attendance, transactions, workers)}
                    </div>
                </div>
            </div>
        `;
    }

    getRecentActivity(attendance, transactions, workers) {
        const activities = [];
        
        // Add recent attendance
        const recentAtt = attendance.slice(-5).reverse();
        recentAtt.forEach(a => {
            const worker = workers.find(w => w.id === a.worker_id);
            if (worker) {
                activities.push({
                    time: a.updated_at || a.created_at,
                    text: `${worker.name} marked ${a.status}`,
                    type: 'attendance'
                });
            }
        });
        
        // Add recent transactions
        const recentTxns = transactions.slice(-5).reverse();
        recentTxns.forEach(t => {
            const worker = workers.find(w => w.id === t.worker_id);
            if (worker) {
                activities.push({
                    time: t.transaction_date || t.created_at,
                    text: `${t.transaction_type}: ${worker.name} - ₹${t.amount}`,
                    type: 'transaction'
                });
            }
        });
        
        // Sort by time and take latest 10
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        const recent = activities.slice(0, 10);
        
        if (recent.length === 0) {
            return '<div class="empty-state"><p>No recent activity</p></div>';
        }
        
        return recent.map(a => `
            <div class="activity-item ${a.type}">
                <span class="activity-icon">
                    <i class="fas ${a.type === 'attendance' ? 'fa-clipboard-check' : 'fa-coins'}"></i>
                </span>
                <span class="activity-text">${a.text}</span>
                <span class="activity-time">${this.formatTime(a.time)}</span>
            </div>
        `).join('');
    }

    formatTime(timeStr) {
        const time = new Date(timeStr);
        const now = new Date();
        const diff = now - time;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return time.toLocaleDateString('en-IN');
    }

    attachEvents(app) {
        document.querySelector('[data-action="addWorker"]')?.addEventListener('click', () => {
            app.showAddWorkerModal();
        });
        
        document.querySelector('[data-action="bulkAttendance"]')?.addEventListener('click', () => {
            app.showBulkAttendanceModal();
        });
        
        document.querySelector('[data-action="exportData"]')?.addEventListener('click', () => {
            app.exportData();
        });
    }
}