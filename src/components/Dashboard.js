// Dashboard Component
export class Dashboard {
    render(state) {
        const summary = state.todaySummary || {};
        const name = state.user?.user_metadata?.name || state.user?.email || 'User';
        const today = new Date().toLocaleDateString('en-IN', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        // Calculate financial totals
        const totalWages = state.workers.reduce((sum, w) => {
            const workerAtt = state.attendance.filter(a => a.worker_id === w.id);
            return sum + workerAtt.reduce((s, a) => s + (a.wage_amount || 0), 0);
        }, 0);
        
        const totalPaid = state.transactions?.filter(t => t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0) || 0;
        
        const totalAdvances = state.transactions?.filter(t => t.transaction_type === 'advance')
            .reduce((sum, t) => sum + t.amount, 0) || 0;
        
        const totalOutstanding = totalWages - totalPaid - totalAdvances;
        
        return `
            <header class="app-header">
                <h1>
                    <i class="fas fa-helmet-safety"></i>
                    Jaiswal · Workforce
                </h1>
                <div class="header-actions">
                    <div class="header-date">
                        <i class="fas fa-calendar"></i> ${today}
                    </div>
                    <div class="header-user">
                        <i class="fas fa-user-circle"></i> ${name}
                    </div>
                    <button class="btn btn-secondary btn-sm" data-action="profile">
                        <i class="fas fa-user-cog"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="logout">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </header>
            
            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card" style="border-left-color:#fbbf24;">
                    <div class="stat-label">
                        <i class="fas fa-users"></i> TOTAL WORKERS
                    </div>
                    <div class="stat-value">${state.workers.length}</div>
                </div>
                <div class="stat-card" style="border-left-color:#22c55e;">
                    <div class="stat-label">
                        <i class="fas fa-user-check"></i> PRESENT TODAY
                    </div>
                    <div class="stat-value">${summary.present_count || 0}</div>
                </div>
                <div class="stat-card" style="border-left-color:#3b82f6;">
                    <div class="stat-label">
                        <i class="fas fa-rupee-sign"></i> PAID TODAY
                    </div>
                    <div class="stat-value">₹${(summary.total_payments || 0).toLocaleString()}</div>
                </div>
                <div class="stat-card" style="border-left-color:#f59e0b;">
                    <div class="stat-label">
                        <i class="fas fa-hand-holding-usd"></i> TOTAL ADVANCES
                    </div>
                    <div class="stat-value">₹${totalAdvances.toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    attachEvents(app) {
        // Profile button
        const profileBtn = document.querySelector('[data-action="profile"]');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => app.showProfile());
        }
        
        // Logout button
        const logoutBtn = document.querySelector('[data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => app.handleLogout());
        }
    }
}
