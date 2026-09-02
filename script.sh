#!/bin/bash

echo "🚀 Fixing Jaiswal Workforce Management System..."
echo "==============================================="

# 1. Fix src/config/supabase.js
echo "📝 Fixing supabase.js..."
cat > src/config/supabase.js << 'EOF'
// Supabase client configuration
const SUPABASE_URL = window.__SUPABASE_URL__ || 'https://yqjuolwntlrnslaxyjsk.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || 'your_anon_key_here';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your_anon_key_here') {
    console.error('❌ Missing Supabase configuration. Check index.html or .env file.');
}

// Create Supabase client
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
EOF
echo "✅ Fixed supabase.js"

# 2. Fix src/config/index.js
echo "📝 Fixing config/index.js..."
cat > src/config/index.js << 'EOF'
export * from './supabase.js';
export * from './runtime-config.js';
EOF
echo "✅ Fixed config/index.js"

# 3. Fix src/config/runtime-config.js
echo "📝 Fixing runtime-config.js..."
cat > src/config/runtime-config.js << 'EOF'
// Runtime configuration loaded from window object
export const runtimeConfig = {
    supabaseUrl: window.__SUPABASE_URL__ || '',
    supabaseAnonKey: window.__SUPABASE_ANON_KEY__ || ''
};
EOF
echo "✅ Fixed runtime-config.js"

# 4. Fix index.html with proper configuration
echo "📝 Fixing index.html..."
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jaiswal Workforce Management</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="./src/styles/main.css" />
    
    <!-- Supabase Configuration - These will be replaced during deployment -->
    <script>
        window.__SUPABASE_URL__ = 'https://yqjuolwntlrnslaxyjsk.supabase.co';
        window.__SUPABASE_ANON_KEY__ = 'YOUR_ANON_KEY_HERE';
    </script>
</head>
<body>
    <div id="app"></div>
    
    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Supabase Client (CDN) -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- Main App Entry -->
    <script type="module" src="./src/main.js"></script>
</body>
</html>
EOF
echo "✅ Fixed index.html"

# 5. Fix src/main.js
echo "📝 Fixing main.js..."
cat > src/main.js << 'EOF'
import { App } from './components/App.js';

console.log('🚀 Jaiswal Workforce Management System started!');

// Initialize the app
const app = new App();
app.init();

// Expose app globally for debugging
window.__app = app;
EOF
echo "✅ Fixed main.js"

# 6. Fix src/lib/index.js
echo "📝 Fixing lib/index.js..."
cat > src/lib/index.js << 'EOF'
export * from './api.js';
export * from './state.js';
EOF
echo "✅ Fixed lib/index.js"

# 7. Fix src/lib/state.js
echo "📝 Fixing state.js..."
cat > src/lib/state.js << 'EOF'
// Application state
export const State = {
    user: null,
    workers: [],
    attendance: [],
    todaySummary: null,
    selectedWorkerId: null,
    viewMonth: new Date().toISOString().slice(0, 7),
    editingWorker: null,
};

// State change listeners
const listeners = [];

export function subscribe(listener) {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) listeners.splice(index, 1);
    };
}

export function updateState(newState) {
    Object.assign(State, newState);
    listeners.forEach(listener => listener(State));
}
EOF
echo "✅ Fixed state.js"

# 8. Fix src/lib/api.js
echo "📝 Fixing api.js..."
cat > src/lib/api.js << 'EOF'
import { supabase } from '../config/supabase.js';
import { State } from './state.js';

export const api = {
    // Workers CRUD
    async getWorkers() {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('active', true)
            .order('name');
        if (error) throw error;
        return data;
    },

    async addWorker(name, role, dailyRate) {
        const { data, error } = await supabase
            .from('workers')
            .insert({
                owner_id: State.user.id,
                name: name.trim(),
                role: role.trim() || 'Worker',
                daily_rate: parseFloat(dailyRate) || 0,
                active: true
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateWorker(id, name, role, dailyRate) {
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
        return data;
    },

    async deleteWorker(id) {
        const { error } = await supabase
            .from('workers')
            .update({ active: false })
            .eq('id', id);
        if (error) throw error;
    },

    // Attendance
    async setAttendance(workerId, status, date, wageAmount) {
        const { data, error } = await supabase
            .rpc('apply_attendance_with_payment', {
                p_worker_id: workerId,
                p_work_date: date,
                p_status: status,
                p_wage_amount: wageAmount,
                p_payment_amount: 0
            });
        if (error) throw error;
        return data;
    },

    async getAttendance(month) {
        const startDate = month + '-01';
        const endDate = month + '-31';
        
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .gte('work_date', startDate)
            .lte('work_date', endDate)
            .order('work_date');
        if (error) throw error;
        return data;
    },

    // Transactions
    async issueAdvance(workerId, amount, description) {
        const { data, error } = await supabase
            .rpc('issue_advance', {
                p_worker_id: workerId,
                p_amount: parseFloat(amount),
                p_description: description || 'Advance payment'
            });
        if (error) throw error;
        return data;
    },

    // Today's Summary
    async getTodaySummary() {
        const { data, error } = await supabase
            .rpc('get_today_summary');
        if (error) throw error;
        return data;
    },

    getMonthDays(yearMonth) {
        const [year, month] = yearMonth.split('-').map(Number);
        return new Date(year, month, 0).getDate();
    }
};
EOF
echo "✅ Fixed api.js"

# 9. Create package.json (for local development only)
echo "📝 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "jaiswal-workforce",
  "version": "1.0.0",
  "description": "Workforce Management System",
  "type": "module",
  "scripts": {
    "start": "npx serve .",
    "dev": "npx serve .",
    "build": "echo 'No build needed - static site'"
  },
  "dependencies": {},
  "devDependencies": {}
}
EOF
echo "✅ Created package.json"

# 10. Fix .github/workflows/deploy.yml
echo "📝 Fixing deploy.yml..."
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Inject Supabase Config
        run: |
          # Replace Supabase URL
          sed -i "s|window.__SUPABASE_URL__ = '.*'|window.__SUPABASE_URL__ = '${{ secrets.VITE_SUPABASE_URL }}'|" index.html
          
          # Replace Supabase Anon Key
          sed -i "s|window.__SUPABASE_ANON_KEY__ = '.*'|window.__SUPABASE_ANON_KEY__ = '${{ secrets.VITE_SUPABASE_ANON_KEY }}'|" index.html
          
          # Ensure .nojekyll exists
          touch .nojekyll
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
EOF
echo "✅ Fixed deploy.yml"

# 11. Fix src/services files if they exist
if [ -f "src/services/workerService.js" ]; then
    echo "📝 Fixing workerService.js..."
    cat > src/services/workerService.js << 'EOF'
import { supabase } from '../config/supabase.js';

export const workerService = {
    async getAll() {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('active', true)
            .order('name');
        if (error) throw error;
        return data;
    },

    async create(workerData) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('workers')
            .insert({
                owner_id: user.id,
                name: workerData.name,
                role: workerData.role || 'Worker',
                daily_rate: parseFloat(workerData.daily_rate) || 0,
                active: true
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('workers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('workers')
            .update({ active: false })
            .eq('id', id);
        if (error) throw error;
    }
};
EOF
    echo "✅ Fixed workerService.js"
fi

if [ -f "src/services/attendanceService.js" ]; then
    echo "📝 Fixing attendanceService.js..."
    cat > src/services/attendanceService.js << 'EOF'
import { supabase } from '../config/supabase.js';

export const attendanceService = {
    async setAttendance(workerId, status, date, wageAmount) {
        const { data, error } = await supabase
            .rpc('apply_attendance_with_payment', {
                p_worker_id: workerId,
                p_work_date: date,
                p_status: status,
                p_wage_amount: wageAmount,
                p_payment_amount: 0
            });
        if (error) throw error;
        return data;
    },

    async getMonthly(month) {
        const startDate = month + '-01';
        const endDate = month + '-31';
        
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .gte('work_date', startDate)
            .lte('work_date', endDate)
            .order('work_date');
        if (error) throw error;
        return data;
    },

    async getTodaySummary() {
        const { data, error } = await supabase
            .rpc('get_today_summary');
        if (error) throw error;
        return data;
    }
};
EOF
    echo "✅ Fixed attendanceService.js"
fi

if [ -f "src/services/transactionService.js" ]; then
    echo "📝 Fixing transactionService.js..."
    cat > src/services/transactionService.js << 'EOF'
import { supabase } from '../config/supabase.js';

export const transactionService = {
    async issueAdvance(workerId, amount, description) {
        const { data, error } = await supabase
            .rpc('issue_advance', {
                p_worker_id: workerId,
                p_amount: parseFloat(amount),
                p_description: description || 'Advance payment'
            });
        if (error) throw error;
        return data;
    },

    async getAll(workerId = null) {
        let query = supabase
            .from('worker_transactions')
            .select('*')
            .order('transaction_date', { ascending: false });
        
        if (workerId) {
            query = query.eq('worker_id', workerId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};
EOF
    echo "✅ Fixed transactionService.js"
fi

# 12. Fix components if needed
if [ -f "src/components/App.js" ]; then
    echo "📝 Fixing App.js..."
    cat > src/components/App.js << 'EOF'
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
        console.log('🔧 App initializing...');
        await this.checkAuth();
        this.render();
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
                this.loadAttendance()
            ]);
            console.log('✅ Data loaded:', {
                workers: this.state.workers.length,
                attendance: this.state.attendance.length
            });
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
        const endDate = this.state.viewMonth + '-31';
        
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

    // Worker Operations
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

    // Attendance Operations
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

    // Advance Operations
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

    // Modal Methods
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
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    showProfile() {
        const user = this.state.user;
        if (!user) return;
        
        const existing = document.getElementById('profileModal');
        if (existing) existing.remove();
        
        const name = user.user_metadata?.name || user.email || 'User';
        
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
                        <label>Email</label>
                        <div class="value">${this.escapeHtml(user.email)}</div>
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
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

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
EOF
    echo "✅ Fixed App.js"
fi

echo ""
echo "==============================================="
echo "🎉 All fixes applied successfully!"
echo "==============================================="
echo ""
echo "Next steps:"
echo "1. Update index.html with your actual Supabase credentials"
echo "2. Test locally: npx serve ."
echo "3. Push to GitHub"
echo "4. Add secrets VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
echo "5. Enable GitHub Pages in repo settings"