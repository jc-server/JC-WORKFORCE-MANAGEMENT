import { supabase } from '../config/supabase.js';
import { Login } from './Login.js';
import { Dashboard } from './Dashboard.js';
import { WorkerTable } from './WorkerTable.js';
import { AttendanceTable } from './AttendanceTable.js';

export class App {
    constructor() {
        this.state = {
            user: null,
            workers: [],
            attendance: [],
            todaySummary: null,
            selectedWorkerId: null,
            viewMonth: new Date().toISOString().slice(0, 7),
        };
        this.components = {
            login: new Login(),
            dashboard: new Dashboard(),
            workerTable: new WorkerTable(),
            attendanceTable: new AttendanceTable(),
        };
    }

    async init() {
        await this.checkAuth();
        this.render();
    }

    async checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            if (user) {
                this.state.user = user;
                await this.loadData();
            }
            return !!user;
        } catch (err) {
            console.error('Auth check error:', err);
            return false;
        }
    }

    async loadData() {
        if (!this.state.user) return;
        
        try {
            await Promise.all([
                this.loadWorkers(),
                this.loadTodaySummary(),
                this.loadAttendance()
            ]);
        } catch (err) {
            console.error('Load data error:', err);
            this.showToast('Error loading data', 'error');
        }
    }

    async loadWorkers() {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('active', true)
            .order('name');
        
        if (error) throw error;
        this.state.workers = data || [];
    }

    async loadTodaySummary() {
        try {
            const { data, error } = await supabase.rpc('get_today_summary');
            if (error) throw error;
            this.state.todaySummary = data || null;
        } catch (err) {
            console.warn('Today summary not available yet:', err);
            this.state.todaySummary = null;
        }
    }

    async loadAttendance() {
        const startDate = this.state.viewMonth + '-01';
        const endDate = this.state.viewMonth + '-' + String(this.getMonthDays(this.state.viewMonth)).padStart(2, '0');
        
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .gte('work_date', startDate)
                .lte('work_date', endDate)
                .order('work_date');
            
            if (error) throw error;
            this.state.attendance = data || [];
        } catch (err) {
            console.warn('Attendance not available yet:', err);
            this.state.attendance = [];
        }
    }

    getMonthDays(yearMonth) {
        const [year, month] = yearMonth.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    }

    async handleLogin(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.state.user = data.user;
            await this.loadData();
            this.render();
            this.showToast('Login successful!', 'success');
            return true;
        } catch (err) {
            this.showToast('Login failed: ' + err.message, 'error');
            return false;
        }
    }

    async handleLogout() {
        try {
            await supabase.auth.signOut();
            this.state.user = null;
            this.state.workers = [];
            this.state.attendance = [];
            this.render();
            this.showToast('Logged out', 'info');
        } catch (err) {
            this.showToast('Logout failed: ' + err.message, 'error');
        }
    }

    // ========================================
    // WORKER OPERATIONS
    // ========================================

    async addWorker(name, role, dailyRate) {
        try {
            const { data, error } = await supabase
                .from('workers')
                .insert({
                    owner_id: this.state.user.id,
                    name: name.trim(),
                    role: role.trim() || 'Worker',
                    daily_rate: parseFloat(dailyRate) || 0,
                    active: true
                })
                .select()
                .single();
            
            if (error) throw error;
            
            this.state.workers.push(data);
            this.render();
            this.showToast('Worker added successfully!', 'success');
            return true;
        } catch (err) {
            this.showToast('Failed to add worker: ' + err.message, 'error');
            return false;
        }
    }

    async updateWorker(id, name, role, dailyRate) {
        try {
            const { data, error } = await supabase
                .from('workers')
                .update({
                    name: name.trim(),
                    role: role.trim() || 'Worker',
                    daily_rate: parseFloat(dailyRate) || 0
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            
            const index = this.state.workers.findIndex(w => w.id === id);
            if (index !== -1) this.state.workers[index] = data;
            
            this.render();
            this.showToast('Worker updated successfully!', 'success');
            return true;
        } catch (err) {
            this.showToast('Failed to update worker: ' + err.message, 'error');
            return false;
        }
    }

    async deleteWorker(id) {
        if (!confirm('Are you sure you want to delete this worker?')) return false;
        
        try {
            const { error } = await supabase
                .from('workers')
                .update({ active: false })
                .eq('id', id);
            
            if (error) throw error;
            
            this.state.workers = this.state.workers.filter(w => w.id !== id);
            this.render();
            this.showToast('Worker deleted successfully!', 'success');
            return true;
        } catch (err) {
            this.showToast('Failed to delete worker: ' + err.message, 'error');
            return false;
        }
    }

    // ========================================
    // ATTENDANCE OPERATIONS
    // ========================================

    async setAttendance(workerId, status, date) {
        try {
            const worker = this.state.workers.find(w => w.id === workerId);
            if (!worker) throw new Error('Worker not found');
            
            let wageAmount = 0;
            if (status === 'present') wageAmount = worker.daily_rate;
            else if (status === 'half-day') wageAmount = worker.daily_rate / 2;
            
            const { data, error } = await supabase
                .rpc('apply_attendance_with_payment', {
                    p_worker_id: workerId,
                    p_work_date: date,
                    p_status: status,
                    p_wage_amount: wageAmount,
                    p_payment_amount: 0
                });
            
            if (error) throw error;
            
            await this.loadAttendance();
            await this.loadTodaySummary();
            this.render();
            this.showToast('Attendance updated!', 'success');
            return true;
        } catch (err) {
            this.showToast('Failed to update attendance: ' + err.message, 'error');
            return false;
        }
    }

    // ========================================
    // ADVANCE OPERATIONS
    // ========================================

    async issueAdvance(workerId, amount, description) {
        try {
            const { data, error } = await supabase
                .rpc('issue_advance', {
                    p_worker_id: workerId,
                    p_amount: parseFloat(amount),
                    p_description: description || 'Advance payment'
                });
            
            if (error) throw error;
            
            this.showToast('Advance issued successfully!', 'success');
            return true;
        } catch (err) {
            this.showToast('Failed to issue advance: ' + err.message, 'error');
            return false;
        }
    }

    // ========================================
    // MODAL METHODS
    // ========================================

    showAddWorkerModal() {
        this.showWorkerModal(null);
    }

    showEditWorkerModal(id) {
        const worker = this.state.workers.find(w => w.id === id);
        if (worker) this.showWorkerModal(worker);
    }

    showWorkerModal(worker = null) {
        const isEdit = !!worker;
        const title = isEdit ? 'Edit Worker' : 'Add Worker';
        const name = worker?.name || '';
        const role = worker?.role || '';
        const dailyRate = worker?.daily_rate || '';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="workerForm">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-control" id="workerName" value="${this.escapeHtml(name)}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <input type="text" class="form-control" id="workerRole" value="${this.escapeHtml(role)}" placeholder="e.g., Mason, Carpenter">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Daily Rate (₹) *</label>
                        <input type="number" class="form-control" id="workerDailyRate" value="${dailyRate}" step="0.01" min="0" required>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Add'} Worker
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = document.getElementById('workerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('workerName').value.trim();
            const role = document.getElementById('workerRole').value.trim();
            const dailyRate = parseFloat(document.getElementById('workerDailyRate').value);
            
            if (!name) {
                this.showToast('Name is required', 'error');
                return;
            }
            
            if (isEdit) {
                await this.updateWorker(worker.id, name, role, dailyRate);
            } else {
                await this.addWorker(name, role, dailyRate);
            }
            modal.remove();
        });
    }

    showAdvanceModal(workerId) {
        const worker = this.state.workers.find(w => w.id === workerId);
        if (!worker) {
            this.showToast('Worker not found', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Issue Advance to ${this.escapeHtml(worker.name)}</div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="advanceForm">
                    <div style="margin-bottom:1rem; padding:1rem; background:#f9fafb; border-radius:0.5rem;">
                        <div style="font-size:0.875rem; color:#6b7280;">Daily Rate: ₹${worker.daily_rate}</div>
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
        `;
        
        document.body.appendChild(modal);
        
        const form = document.getElementById('advanceForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('advanceAmount').value);
            const description = document.getElementById('advanceDescription').value.trim();
            
            if (!amount || amount <= 0) {
                this.showToast('Please enter a valid amount', 'error');
                return;
            }
            
            await this.issueAdvance(workerId, amount, description);
            modal.remove();
        });
    }

    showProfile() {
        const user = this.state.user;
        if (!user) return;
        
        const name = user.user_metadata?.name || user.email || 'User';
        const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title"><i class="fas fa-user-circle"></i> Profile</div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="profile-grid">
                    <div class="profile-field">
                        <label>Name</label>
                        <div class="value">${this.escapeHtml(name)}</div>
                    </div>
                    <div class="profile-field">
                        <label>Email</label>
                        <div class="value">${this.escapeHtml(user.email)}</div>
                    </div>
                    <div class="profile-field">
                        <label>Member Since</label>
                        <div class="value">${createdAt || 'N/A'}</div>
                    </div>
                    <div class="profile-field">
                        <label>User ID</label>
                        <div class="value" style="font-size:0.75rem; color:#6b7280;">${user.id}</div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 5000);
    }

    render() {
        const app = document.getElementById('app');
        
        if (!this.state.user) {
            app.innerHTML = this.components.login.render();
            this.components.login.attachEvents(this);
            return;
        }
        
        app.innerHTML = `
            ${this.components.dashboard.render(this.state)}
            ${this.components.workerTable.render(this.state)}
            ${this.components.attendanceTable.render(this.state)}
        `;
        
        this.components.dashboard.attachEvents(this);
        this.components.workerTable.attachEvents(this);
        this.components.attendanceTable.attachEvents(this);
    }
}
