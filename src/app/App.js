import { supabase } from '../config/supabase.js';
import { Dashboard } from '../components/Dashboard.js';
import { WorkerTable } from '../components/WorkerTable.js';
import { AttendanceTable } from '../components/AttendanceTable.js';
import { AttendanceCalendar } from '../components/AttendanceCalendar.js';
import { FinancialLedger } from '../components/FinancialLedger.js';
import { Analytics } from '../components/Analytics.js';
import { Login } from '../components/Login.js';
import { Toast } from '../components/UI/Toast.js';
import { LoadingOverlay } from '../components/UI/LoadingOverlay.js';
import { NotificationCenter } from '../components/UI/NotificationCenter.js';
import * as workerService from '../services/api/workerService.js';
import * as attendanceService from '../services/api/attendanceService.js';
import * as transactionService from '../services/api/transactionService.js';

export class App {
    constructor(stateManager, eventBus) {
        this.state = stateManager;
        this.events = eventBus;
        this.loading = new LoadingOverlay();
        this.toast = new Toast();
        this.notifications = new NotificationCenter();
        
        // Component instances
        this.components = {
            dashboard: new Dashboard(),
            workerTable: new WorkerTable(),
            attendanceTable: new AttendanceTable(),
            attendanceCalendar: new AttendanceCalendar(),
            financialLedger: new FinancialLedger(),
            analytics: new Analytics(),
            login: new Login()
        };
        
        this.syncInterval = null;
    }

    async init() {
        console.log('🔧 Initializing SuperLabor App...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check authentication
        await this.checkAuth();
        
        // Start auto-sync
        this.startAutoSync();
        
        // Setup offline support
        this.setupOfflineSupport();
        
        // Render
        this.render();
    }

    setupEventListeners() {
        // Theme toggle
        document.addEventListener('theme:change', (e) => {
            this.state.set('theme', e.detail.theme);
            this.applyTheme(e.detail.theme);
        });
        
        // Network events
        this.events.on('network:online', () => {
            this.syncData();
            this.toast.show('Back online! Syncing data...', 'success');
        });
        
        this.events.on('network:offline', () => {
            this.toast.show('You are offline. Changes will sync when online.', 'warning');
        });
        
        // Data change events
        this.events.on('data:workers:updated', () => {
            this.render();
        });
        
        this.events.on('data:attendance:updated', () => {
            this.render();
        });
        
        this.events.on('data:transactions:updated', () => {
            this.render();
        });
    }

    setupOfflineSupport() {
        // Save state periodically when offline
        setInterval(() => {
            if (this.state.get('isOffline')) {
                this.state.saveToCache();
            }
        }, 30000);
    }

    startAutoSync() {
        this.syncInterval = setInterval(() => {
            if (!this.state.get('isOffline') && this.state.get('user')) {
                this.syncData();
            }
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    async syncData() {
        if (!this.state.get('user')) return;
        
        console.log('🔄 Syncing data...');
        try {
            await this.loadData();
            this.state.set('lastSync', new Date().toISOString());
            this.events.emit('data:synced');
            console.log('✅ Sync complete');
        } catch (err) {
            console.error('❌ Sync failed:', err);
        }
    }

    async checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            
            if (user) {
                console.log('✅ User authenticated:', user.email);
                this.state.set('user', user);
                await this.loadData();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Auth error:', err);
            return false;
        }
    }

    async loadData() {
        if (!this.state.get('user')) return;
        
        this.loading.show();
        
        try {
            const [workers, attendance, transactions, summary] = await Promise.all([
                workerService.getAll(),
                attendanceService.getMonthly(this.state.get('viewMonth')),
                transactionService.getAll(),
                attendanceService.getTodaySummary()
            ]);
            
            this.state.updateState({
                workers: workers || [],
                attendance: attendance || [],
                transactions: transactions || [],
                todaySummary: summary || null,
                lastSync: new Date().toISOString()
            });
            
            console.log('📊 Data loaded:', {
                workers: workers.length,
                attendance: attendance.length,
                transactions: transactions.length
            });
        } catch (err) {
            console.error('❌ Load data error:', err);
            this.toast.show('Error loading data', 'error');
        } finally {
            this.loading.hide();
        }
    }

    async reloadData() {
        await this.loadData();
        this.render();
    }

    async handleLogin(email, password) {
        try {
            this.loading.show();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.state.set('user', data.user);
            await this.loadData();
            this.render();
            this.toast.show('Welcome back! 👋', 'success');
            this.events.emit('auth:login', data.user);
            return true;
        } catch (err) {
            this.toast.show('Login failed: ' + err.message, 'error');
            return false;
        } finally {
            this.loading.hide();
        }
    }

    async handleLogout() {
        try {
            await supabase.auth.signOut();
            this.state.updateState({
                user: null,
                workers: [],
                attendance: [],
                transactions: [],
                todaySummary: null
            });
            this.render();
            this.toast.show('Logged out', 'info');
            this.events.emit('auth:logout');
        } catch (err) {
            this.toast.show('Logout failed: ' + err.message, 'error');
        }
    }

    handleOnline() {
        this.state.set('isOffline', false);
        this.syncData();
    }

    handleOffline() {
        this.state.set('isOffline', true);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelector('#themeToggle i').className = 
            theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // ========================================
    // WORKER OPERATIONS
    // ========================================

    async addWorker(name, role, dailyRate) {
        try {
            const worker = await workerService.create({
                name,
                role,
                daily_rate: dailyRate
            });
            
            const workers = [...this.state.get('workers'), worker];
            this.state.set('workers', workers);
            this.events.emit('data:workers:updated', worker);
            this.toast.show('Worker added successfully!', 'success');
            return true;
        } catch (err) {
            this.toast.show('Failed to add worker: ' + err.message, 'error');
            return false;
        }
    }

    async updateWorker(id, name, role, dailyRate) {
        try {
            const worker = await workerService.update(id, {
                name,
                role,
                daily_rate: dailyRate
            });
            
            const workers = this.state.get('workers').map(w => 
                w.id === id ? worker : w
            );
            this.state.set('workers', workers);
            this.events.emit('data:workers:updated', worker);
            this.toast.show('Worker updated successfully!', 'success');
            return true;
        } catch (err) {
            this.toast.show('Failed to update worker: ' + err.message, 'error');
            return false;
        }
    }

    async deleteWorker(id) {
        if (!confirm('Are you sure you want to delete this worker?')) return false;
        
        try {
            await workerService.delete(id);
            const workers = this.state.get('workers').filter(w => w.id !== id);
            this.state.set('workers', workers);
            this.events.emit('data:workers:updated');
            this.toast.show('Worker deleted successfully!', 'success');
            return true;
        } catch (err) {
            this.toast.show('Failed to delete worker: ' + err.message, 'error');
            return false;
        }
    }

    // ========================================
    // ATTENDANCE OPERATIONS
    // ========================================

    async setAttendance(workerId, status, date, paymentAmount = 0) {
        try {
            const worker = this.state.get('workers').find(w => w.id === workerId);
            if (!worker) {
                this.toast.show('Worker not found', 'error');
                return false;
            }
            
            let wageAmount = 0;
            if (status === 'present') wageAmount = worker.daily_rate;
            else if (status === 'half-day') wageAmount = worker.daily_rate / 2;
            
            const result = await attendanceService.setAttendance({
                workerId,
                date,
                status,
                wageAmount,
                paymentAmount
            });
            
            // Update state
            await this.loadData();
            this.events.emit('data:attendance:updated', result);
            this.toast.show('Attendance updated!', 'success');
            return true;
        } catch (err) {
            this.toast.show('Failed to update attendance: ' + err.message, 'error');
            return false;
        }
    }

    async bulkSetAttendance(workerIds, status, date) {
        try {
            const results = await Promise.all(
                workerIds.map(id => this.setAttendance(id, status, date))
            );
            const success = results.filter(r => r).length;
            this.toast.show(`${success} workers updated!`, 'success');
            return results;
        } catch (err) {
            this.toast.show('Bulk update failed: ' + err.message, 'error');
            return [];
        }
    }

    async updatePayment(workerId, date, paymentAmount) {
        try {
            await attendanceService.updatePayment(workerId, date, paymentAmount);
            await this.loadData();
            this.events.emit('data:attendance:updated');
            this.toast.show('Payment updated!', 'success');
        } catch (err) {
            this.toast.show('Failed to update payment: ' + err.message, 'error');
        }
    }

    // ========================================
    // FINANCIAL OPERATIONS
    // ========================================

    async issueAdvance(workerId, amount, description) {
        try {
            await transactionService.issueAdvance(workerId, amount, description);
            await this.loadData();
            this.events.emit('data:transactions:updated');
            this.toast.show('Advance issued successfully!', 'success');
            return true;
        } catch (err) {
            this.toast.show('Failed to issue advance: ' + err.message, 'error');
            return false;
        }
    }

    // ========================================
    // VIEWS & MODALS
    // ========================================

    showAddWorkerModal() {
        this.showModal('worker', null);
    }

    showEditWorkerModal(id) {
        const worker = this.state.get('workers').find(w => w.id === id);
        if (worker) this.showModal('worker', worker);
    }

    showAdvanceModal(workerId) {
        const worker = this.state.get('workers').find(w => w.id === workerId);
        if (worker) this.showModal('advance', worker);
    }

    showWorkerProfile(workerId) {
        const worker = this.state.get('workers').find(w => w.id === workerId);
        if (worker) this.showModal('profile', worker);
    }

    showBulkAttendanceModal() {
        this.showModal('bulkAttendance', null);
    }

    showModal(type, data) {
        // Dynamic modal loading - handled by components
        this.events.emit('modal:show', { type, data });
    }

    // ========================================
    // RENDER
    // ========================================

    render() {
        const app = document.getElementById('app');
        const user = this.state.get('user');
        
        if (!user) {
            app.innerHTML = this.components.login.render();
            this.components.login.attachEvents(this);
            return;
        }
        
        // Render main app with tabs
        app.innerHTML = `
            <div class="app-container">
                <header class="app-header">
                    <div class="header-left">
                        <h1>
                            <i class="fas fa-helmet-safety"></i>
                            SuperLabor
                        </h1>
                        <div class="header-status">
                            ${this.state.get('isOffline') ? 
                                '<span class="status-badge offline"><i class="fas fa-wifi-slash"></i> Offline</span>' : 
                                '<span class="status-badge online"><i class="fas fa-wifi"></i> Online</span>'
                            }
                        </div>
                    </div>
                    <div class="header-center">
                        <div class="search-bar">
                            <i class="fas fa-search"></i>
                            <input type="text" id="globalSearch" placeholder="Search workers, attendance..." />
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="btn btn-secondary btn-sm" data-action="notifications">
                            <i class="fas fa-bell"></i>
                            <span class="badge" id="notificationBadge">0</span>
                        </button>
                        <button class="btn btn-secondary btn-sm" data-action="export">
                            <i class="fas fa-download"></i>
                        </button>
                        <div class="header-user">
                            <i class="fas fa-user-circle"></i>
                            ${user.email}
                        </div>
                        <button class="btn btn-danger btn-sm" data-action="logout">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </header>
                
                <div class="tab-nav">
                    <button class="tab-btn active" data-tab="dashboard">
                        <i class="fas fa-chart-pie"></i> Dashboard
                    </button>
                    <button class="tab-btn" data-tab="workers">
                        <i class="fas fa-users"></i> Workers
                    </button>
                    <button class="tab-btn" data-tab="attendance">
                        <i class="fas fa-clipboard-check"></i> Attendance
                    </button>
                    <button class="tab-btn" data-tab="calendar">
                        <i class="fas fa-calendar"></i> Calendar
                    </button>
                    <button class="tab-btn" data-tab="financials">
                        <i class="fas fa-coins"></i> Financials
                    </button>
                    <button class="tab-btn" data-tab="analytics">
                        <i class="fas fa-chart-line"></i> Analytics
                    </button>
                </div>
                
                <div class="tab-content">
                    <div class="tab-panel active" id="tab-dashboard">
                        ${this.components.dashboard.render(this.state.getState())}
                    </div>
                    <div class="tab-panel" id="tab-workers">
                        ${this.components.workerTable.render(this.state.getState())}
                    </div>
                    <div class="tab-panel" id="tab-attendance">
                        ${this.components.attendanceTable.render(this.state.getState())}
                    </div>
                    <div class="tab-panel" id="tab-calendar">
                        ${this.components.attendanceCalendar.render(this.state.getState())}
                    </div>
                    <div class="tab-panel" id="tab-financials">
                        ${this.components.financialLedger.render(this.state.getState())}
                    </div>
                    <div class="tab-panel" id="tab-analytics">
                        ${this.components.analytics.render(this.state.getState())}
                    </div>
                </div>
            </div>
        `;
        
        // Attach events to all components
        this.attachEvents();
        this.setupTabNavigation();
        this.setupSearch();
    }

    attachEvents() {
        // Dashboard events
        this.components.dashboard.attachEvents(this);
        
        // Worker table events
        this.components.workerTable.attachEvents(this);
        
        // Attendance table events
        this.components.attendanceTable.attachEvents(this);
        
        // Calendar events
        this.components.attendanceCalendar.attachEvents(this);
        
        // Financial ledger events
        this.components.financialLedger.attachEvents(this);
        
        // Analytics events
        this.components.analytics.attachEvents(this);
        
        // Global events
        document.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
            this.handleLogout();
        });
        
        document.querySelector('[data-action="export"]')?.addEventListener('click', () => {
            this.exportData();
        });
        
        document.querySelector('[data-action="notifications"]')?.addEventListener('click', () => {
            this.toggleNotifications();
        });
    }

    setupTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update tabs
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update panels
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(`tab-${tab}`)?.classList.add('active');
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this.state.set('filters', { 
                    ...this.state.get('filters'), 
                    search: query 
                });
                this.filterData(query);
            });
        }
    }

    filterData(query) {
        // Filter workers
        const workers = this.state.get('workers');
        const filtered = workers.filter(w => 
            w.name.toLowerCase().includes(query) ||
            (w.role && w.role.toLowerCase().includes(query))
        );
        this.state.set('filteredWorkers', filtered);
        // Re-render will happen via state change
    }

    async exportData() {
        const format = confirm('Export as CSV? Click OK for CSV, Cancel for JSON');
        try {
            const data = {
                workers: this.state.get('workers'),
                attendance: this.state.get('attendance'),
                transactions: this.state.get('transactions')
            };
            
            if (format) {
                // CSV Export
                const csv = this.convertToCSV(data);
                this.downloadFile(csv, 'superlabor_export.csv', 'text/csv');
            } else {
                // JSON Export
                const json = JSON.stringify(data, null, 2);
                this.downloadFile(json, 'superlabor_export.json', 'application/json');
            }
            
            this.toast.show('Export successful!', 'success');
        } catch (err) {
            this.toast.show('Export failed: ' + err.message, 'error');
        }
    }

    convertToCSV(data) {
        // Simple CSV conversion
        let csv = 'Worker,Role,Daily Rate,Total Wages,Advances,Payments,Balance\n';
        data.workers.forEach(w => {
            const balance = this.state.getWorkerBalance(w.id);
            csv += `${w.name},${w.role || 'Worker'},${w.daily_rate},${balance.wages},${balance.advances},${balance.payments},${balance.balance}\n`;
        });
        return csv;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toggleNotifications() {
        this.notifications.toggle();
    }
}