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
            transactions: [],
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
        console.log('🔧 App initializing...');
        await this.checkAuth();
        this.startSessionRefresh();
        this.render();
    }

    startSessionRefresh() {
        // Check session every 50 minutes
        setInterval(async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                
                if (!session && this.state.user) {
                    console.log('⚠️ Session expired, logging out...');
                    this.handleSessionExpiry();
                }
            } catch (err) {
                console.error('Session check error:', err);
            }
        }, 50 * 60 * 1000); // 50 minutes
    }

    handleSessionExpiry() {
        this.state.user = null;
        this.state.workers = [];
        this.state.attendance = [];
        this.state.transactions = [];
        this.state.todaySummary = null;
        this.render();
        this.showToast('Session expired. Please login again.', 'warning');
    }

    async checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            if (user) {
                console.log('✅ User authenticated:', user.email);
                this.state.user = user;
                await this.loadData();
            } else {
                console.log('🔓 No user logged in');
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
            console.log('📊 Loading data...');
            await Promise.all([
                this.loadWorkers(),
                this.loadTodaySummary(),
                this.loadAttendance(),
                this.loadTransactions()
            ]);
            console.log('✅ Data loaded:', {
                workers: this.state.workers.length,
                attendance: this.state.attendance.length,
                transactions: this.state.transactions.length
            });
        } catch (err) {
            console.error('Load data error:', err);
            this.showToast('Error loading data', 'error');
        }
    }

    async loadWorkers() {
        console.log('👷 Loading workers...');
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('active', true)
            .order('name');
        
        if (error) {
            console.error('❌ Error loading workers:', error);
            throw error;
        }
        
        this.state.workers = data || [];
        console.log('✅ Workers loaded:', this.state.workers.length);
    }

    async loadTodaySummary() {
        try {
            console.log('📈 Loading today summary...');
            const { data, error } = await supabase.rpc('get_today_summary');
            if (error) throw error;
            this.state.todaySummary = data || null;
            console.log('✅ Today summary:', this.state.todaySummary);
        } catch (err) {
            console.warn('Today summary not available yet:', err);
            this.state.todaySummary = null;
        }
    }

    async loadAttendance() {
        const startDate = this.state.viewMonth + '-01';
        const endDate = this.state.viewMonth + '-31';
        
        try {
            console.log('📅 Loading attendance for', this.state.viewMonth);
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .gte('work_date', startDate)
                .lte('work_date', endDate)
                .order('work_date');
            
            if (error) throw error;
            this.state.attendance = data || [];
            console.log('✅ Attendance loaded:', this.state.attendance.length);
        } catch (err) {
            console.warn('Attendance not available yet:', err);
            this.state.attendance = [];
        }
    }

    async loadTransactions() {
        try {
            console.log('💳 Loading transactions...');
            const { data, error } = await supabase
                .from('worker_transactions')
                .select('*')
                .order('transaction_date', { ascending: false });
            
            if (error) throw error;
            this.state.transactions = data || [];
            console.log('✅ Transactions loaded:', this.state.transactions.length);
        } catch (err) {
            console.warn('Could not load transactions:', err);
            this.state.transactions = [];
        }
    }

    async handleLogin(email, password) {
        try {
            console.log('🔑 Logging in...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            console.log('✅ Login successful:', data.user.email);
            this.state.user = data.user;
            await this.loadData();
            this.render();
            this.showToast('Login successful!', 'success');
            return true;
        } catch (err) {
            console.error('❌ Login failed:', err);
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
            this.state.transactions = [];
            this.render();
            this.showToast('Logged out', 'info');
        } catch (err) {
            this.showToast('Logout failed: ' + err.message, 'error');
        }
    }

    // ========================================
    // WORKER OPERATIONS
    // ========================================

    async addWorker(name, role, dailyRate, initialAdvance = 0) {
        try {
            console.log('➕ Adding worker:', name);
            const { data, error } = await supabase
                .from('workers')
                .insert({
                    owner_id: this.state.user.id,
                    name: name.trim(),
                    role: role.trim() || 'Worker',
                    daily_rate: parseFloat(dailyRate) || 0,
                    current_advance: parseFloat(initialAdvance) || 0,
                    active: true
                })
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('✅ Worker added:', data);
            
            // If initial advance, record it
            if (parseFloat(initialAdvance) > 0) {
                console.log('💰 Recording initial advance:', initialAdvance);
                const { error: txnError } = await supabase
                    .from('worker_transactions')
                    .insert({
                        owner_id: this.state.user.id,
                        worker_id: data.id,
                        transaction_type: 'advance',
                        amount: parseFloat(initialAdvance),
                        description: 'Initial advance'
                    });
                
                if (txnError) console.error('❌ Error recording advance:', txnError);
            }
            
            this.state.workers.push(data);
            await this.loadTransactions();
            this.render();
            this.showToast('Worker added successfully!', 'success');
            return true;
        } catch (err) {
            console.error('❌ Error adding worker:', err);
            this.showToast('Failed to add worker: ' + err.message, 'error');
            return false;
        }
    }

    async updateWorker(id, name, role, dailyRate) {
        try {
            console.log('✏️ Updating worker:', id);
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
            console.error('❌ Error updating worker:', err);
            this.showToast('Failed to update worker: ' + err.message, 'error');
            return false;
        }
    }

    async deleteWorker(id) {
        if (!confirm('Are you sure you want to delete this worker?')) return false;
        
        try {
            console.log('🗑️ Deleting worker:', id);
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
            console.error('❌ Error deleting worker:', err);
            this.showToast('Failed to delete worker: ' + err.message, 'error');
            return false;
        }
    }

    // ========================================
    // ATTENDANCE OPERATIONS - FIXED
    // ========================================

    async setAttendance(workerId, status, date, paymentAmount = 0) {
        try {
            console.log('📝 Setting attendance:', { workerId, status, date, paymentAmount });
            
            const worker = this.state.workers.find(w => w.id === workerId);
            if (!worker) throw new Error('Worker not found');
            
            let wageAmount = 0;
            if (status === 'present') wageAmount = worker.daily_rate;
            else if (status === 'half-day') wageAmount = worker.daily_rate / 2;
            
            console.log('💰 Wage amount:', wageAmount);
            
            // Smart advance & overpayment handling
            let advanceOverflow = 0;
            let paymentRecorded = paymentAmount;
            
            // If payment exceeds wage, calculate overflow as advance
            if (paymentAmount > wageAmount) {
                advanceOverflow = paymentAmount - wageAmount;
                paymentRecorded = wageAmount;
                
                // Record overflow as advance
                if (advanceOverflow > 0) {
                    console.log('💰 Advance overflow:', advanceOverflow);
                    const { data, error } = await supabase
                        .rpc('issue_advance', {
                            p_worker_id: workerId,
                            p_amount: advanceOverflow,
                            p_description: 'Payment overflow on ' + date
                        });
                    
                    if (error) throw error;
                    console.log('✅ Advance overflow recorded:', data);
                }
            }
            
            // Apply attendance with smart payment handling
            console.log('📤 Calling apply_attendance_with_payment...');
            const { data, error } = await supabase
                .rpc('apply_attendance_with_payment', {
                    p_worker_id: workerId,
                    p_work_date: date,
                    p_status: status,
                    p_wage_amount: wageAmount,
                    p_payment_amount: paymentRecorded
                });
            
            if (error) {
                console.error('❌ Error calling RPC:', error);
                throw error;
            }
            
            console.log('✅ Attendance RPC response:', data);
            
            // Reload all data
            console.log('🔄 Reloading data...');
            await Promise.all([
                this.loadAttendance(),
                this.loadTodaySummary(),
                this.loadTransactions()
            ]);
            
            // Force re-render
            this.render();
            
            console.log('✅ Attendance updated successfully!');
            this.showToast('Attendance updated!', 'success');
            return true;
        } catch (err) {
            console.error('❌ Error setting attendance:', err);
            this.showToast('Failed to update attendance: ' + err.message, 'error');
            return false;
        }
    }

    async updatePayment(workerId, date, paymentAmount) {
        try {
            console.log('💳 Updating payment:', { workerId, date, paymentAmount });
            
            // Get existing attendance record
            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('worker_id', workerId)
                .eq('work_date', date)
                .single();
            
            if (attError) {
                console.error('❌ Error fetching attendance:', attError);
                throw attError;
            }
            
            if (!attData) {
                console.error('❌ No attendance record found');
                this.showToast('No attendance record found for this date', 'error');
                return;
            }
            
            console.log('📋 Existing attendance:', attData);
            
            // Smart advance handling
            let advanceOverflow = 0;
            let paymentRecorded = paymentAmount;
            
            if (paymentAmount > attData.wage_amount) {
                advanceOverflow = paymentAmount - attData.wage_amount;
                paymentRecorded = attData.wage_amount;
                
                // Record overflow as advance
                if (advanceOverflow > 0) {
                    console.log('💰 Advance overflow:', advanceOverflow);
                    const { data, error } = await supabase
                        .rpc('issue_advance', {
                            p_worker_id: workerId,
                            p_amount: advanceOverflow,
                            p_description: 'Payment overflow on ' + date
                        });
                    
                    if (error) throw error;
                    console.log('✅ Advance overflow recorded:', data);
                }
            }
            
            // Update attendance with payment
            console.log('📤 Updating attendance payment...');
            const { error } = await supabase
                .from('attendance')
                .update({ 
                    payment_amount: paymentRecorded,
                    updated_at: new Date().toISOString()
                })
                .eq('worker_id', workerId)
                .eq('work_date', date);
            
            if (error) {
                console.error('❌ Error updating payment:', error);
                throw error;
            }
            
            console.log('✅ Payment updated');
            
            // Reload data
            await Promise.all([
                this.loadAttendance(),
                this.loadTransactions(),
                this.loadTodaySummary()
            ]);
            
            // Re-render
            this.render();
            this.showToast('Payment updated successfully!', 'success');
        } catch (err) {
            console.error('❌ Error updating payment:', err);
            this.showToast('Failed to update payment: ' + err.message, 'error');
        }
    }

    // ========================================
    // ADVANCE OPERATIONS
    // ========================================

    async issueAdvance(workerId, amount, description) {
        try {
            console.log('💰 Issuing advance:', { workerId, amount, description });
            const { data, error } = await supabase
                .rpc('issue_advance', {
                    p_worker_id: workerId,
                    p_amount: parseFloat(amount),
                    p_description: description || 'Advance payment'
                });
            
            if (error) throw error;
            
            console.log('✅ Advance issued:', data);
            await this.loadTransactions();
            await this.loadWorkers();
            this.render();
            this.showToast('Advance issued successfully!', 'success');
            return true;
        } catch (err) {
            console.error('❌ Error issuing advance:', err);
            this.showToast('Failed to issue advance: ' + err.message, 'error');
            return false;
        }
    }

    // ========================================
    // MODAL METHODS
    // ========================================

    showAddWorkerModal() {
        console.log('➕ Showing Add Worker modal');
        this.showWorkerModal(null);
    }

    showEditWorkerModal(id) {
        console.log('✏️ Showing Edit Worker modal for:', id);
        const worker = this.state.workers.find(w => w.id === id);
        if (worker) this.showWorkerModal(worker);
    }

    showWorkerModal(worker = null) {
        const isEdit = !!worker;
        const title = isEdit ? 'Edit Worker' : 'Add Worker';
        const name = worker?.name || '';
        const role = worker?.role || '';
        const dailyRate = worker?.daily_rate || '';
        const initialAdvance = worker?.current_advance || 0;
        
        const existing = document.getElementById('workerModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'workerModal';
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
                        <input type="text" class="form-control" id="workerRole" value="${this.escapeHtml(role)}" placeholder="e.g., Shuttering, Mason">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Daily Rate (₹) *</label>
                        <input type="number" class="form-control" id="workerDailyRate" value="${dailyRate}" step="0.01" min="0" required>
                    </div>
                    ${!isEdit ? `
                        <div class="form-group">
                            <label class="form-label">Initial Advance (₹)</label>
                            <input type="number" class="form-control" id="workerInitialAdvance" value="${initialAdvance}" step="0.01" min="0">
                        </div>
                    ` : ''}
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
        
        const form = document.getElementById('workerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('workerName').value.trim();
            const role = document.getElementById('workerRole').value.trim();
            const dailyRate = parseFloat(document.getElementById('workerDailyRate').value);
            const initialAdvance = document.getElementById('workerInitialAdvance')?.value || 0;
            
            if (!name) {
                this.showToast('Name is required', 'error');
                return;
            }
            
            if (isEdit) {
                await this.updateWorker(worker.id, name, role, dailyRate);
            } else {
                await this.addWorker(name, role, dailyRate, initialAdvance);
            }
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    showAdvanceModal(workerId) {
        const worker = this.state.workers.find(w => w.id === workerId);
        if (!worker) {
            this.showToast('Worker not found', 'error');
            return;
        }
        
        const existing = document.getElementById('advanceModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'advanceModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Issue Advance to ${this.escapeHtml(worker.name)}</div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <form id="advanceForm">
                    <div style="margin-bottom:1rem; padding:1rem; background:#0f172a; border-radius:0.5rem;">
                        <div style="font-size:0.875rem; color:#94a3b8;">Daily Rate: ₹${worker.daily_rate}</div>
                        <div style="font-size:0.875rem; color:#94a3b8;">Current Advance: ₹${worker.current_advance || 0}</div>
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
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // ========================================
    // WORKER PROFILE VIEW - FIXED
    // ========================================

    showWorkerProfile(workerId) {
        console.log('👤 Showing worker profile:', workerId);
        const worker = this.state.workers.find(w => w.id === workerId);
        if (!worker) {
            this.showToast('Worker not found', 'error');
            return;
        }
        
        // Get worker-specific attendance
        const workerAttendance = this.state.attendance.filter(a => a.worker_id === workerId);
        console.log('📊 Worker attendance:', workerAttendance.length);
        
        // Get worker-specific transactions
        const workerTransactions = this.state.transactions.filter(t => t.worker_id === workerId);
        console.log('💳 Worker transactions:', workerTransactions.length);
        
        // Create profile modal content
        const modal = document.createElement('div');
        modal.id = 'workerProfileModal';
        modal.className = 'modal-overlay';
        
        // Calculate financials
        const totalWages = workerAttendance.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
        const totalPaid = workerTransactions
            .filter(t => t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalAdvances = workerTransactions
            .filter(t => t.transaction_type === 'advance')
            .reduce((sum, t) => sum + t.amount, 0);
        const netBalance = totalWages - totalPaid - totalAdvances;
        
        // Get current month attendance
        const currentMonth = this.state.viewMonth;
        const monthAttendance = workerAttendance.filter(a => a.work_date.startsWith(currentMonth));
        
        modal.innerHTML = `
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
                        <div class="value">₹${(worker.daily_rate || 0).toLocaleString()}</div>
                    </div>
                    <div class="worker-profile-field">
                        <label>Total Wages</label>
                        <div class="value">₹${totalWages.toLocaleString()}</div>
                    </div>
                    <div class="worker-profile-field">
                        <label>Total Paid</label>
                        <div class="value">₹${totalPaid.toLocaleString()}</div>
                    </div>
                    <div class="worker-profile-field">
                        <label>Advances</label>
                        <div class="value">₹${totalAdvances.toLocaleString()}</div>
                    </div>
                    <div class="worker-profile-field">
                        <label>Net Balance</label>
                        <div class="value" style="color: ${netBalance >= 0 ? '#4ade80' : '#f87171'};">
                            ₹${netBalance.toLocaleString()}
                        </div>
                    </div>
                </div>
                
                <!-- Month Navigation -->
                <div class="calendar-nav">
                    <button class="btn btn-secondary btn-sm" onclick="window.__app.navigateWorkerMonth('${worker.id}', '${this.getPrevMonth(currentMonth)}')">
                        <i class="fas fa-chevron-left"></i> Prev
                    </button>
                    <h3 class="calendar-month">${this.getMonthName(currentMonth)}</h3>
                    <button class="btn btn-secondary btn-sm" onclick="window.__app.navigateWorkerMonth('${worker.id}', '${this.getNextMonth(currentMonth)}')">
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
                            </tr>
                        </thead>
                        <tbody>
                            ${this.getCalendarDays(currentMonth, worker.id, workerAttendance)}
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
        `;
        
        document.body.appendChild(modal);
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
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
                    <td>${wage ? '₹' + wage.toLocaleString() : '-'}</td>
                    <td>${payment ? '₹' + payment.toLocaleString() : '-'}</td>
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

    navigateWorkerMonth(workerId, month) {
        console.log('📅 Navigating to month:', month);
        this.state.viewMonth = month;
        this.loadAttendance().then(() => {
            this.showWorkerProfile(workerId);
        });
    }

    // ========================================
    // PROFILE MODAL
    // ========================================

    showProfile() {
        const user = this.state.user;
        if (!user) return;
        
        const existing = document.getElementById('profileModal');
        if (existing) existing.remove();
        
        const name = user.user_metadata?.name || user.email || 'User';
        const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '';
        
        const modal = document.createElement('div');
        modal.id = 'profileModal';
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
                        <div class="value" style="font-size:0.75rem; color:#94a3b8;">${user.id}</div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
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
            <div class="app-container">
                ${this.components.dashboard.render(this.state)}
                ${this.components.workerTable.render(this.state)}
                ${this.components.attendanceTable.render(this.state)}
            </div>
        `;
        
        this.components.dashboard.attachEvents(this);
        this.components.workerTable.attachEvents(this);
        this.components.attendanceTable.attachEvents(this);
    }
}
