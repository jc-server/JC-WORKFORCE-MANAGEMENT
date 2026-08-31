// Dashboard Component
export class Dashboard {
    render(state) {
        const summary = state.todaySummary || {};
        const name = state.user?.user_metadata?.name || state.user?.email || 'User';
        
        return `
            <header class="app-header">
                <h1>
                    <i class="fas fa-users"></i>
                    Jaiswal Workforce
                </h1>
                <div class="header-actions">
                    <span style="font-size:0.875rem; color:#6b7280;">
                        <i class="fas fa-user"></i> ${name}
                    </span>
                    <button class="btn btn-secondary btn-sm" data-action="profile">
                        <i class="fas fa-user-cog"></i> Profile
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="logout">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </header>
            <div class="stats-grid">
                <div class="stat-card" style="border-left-color:#3b82f6;">
                    <div class="stat-label">Total Workers</div>
                    <div class="stat-value">${state.workers.length}</div>
                </div>
                <div class="stat-card" style="border-left-color:#22c55e;">
                    <div class="stat-label">Today Present</div>
                    <div class="stat-value">${summary.present_count || 0}</div>
                    <div class="stat-sub">${summary.total_count || 0} total</div>
                </div>
                <div class="stat-card" style="border-left-color:#f59e0b;">
                    <div class="stat-label">Today Wages</div>
                    <div class="stat-value">₹${(summary.total_wages || 0).toLocaleString()}</div>
                </div>
                <div class="stat-card" style="border-left-color:#ef4444;">
                    <div class="stat-label">Today Payments</div>
                    <div class="stat-value">₹${(summary.total_payments || 0).toLocaleString()}</div>
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
