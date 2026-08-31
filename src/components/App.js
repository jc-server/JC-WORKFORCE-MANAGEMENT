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
            return true;
        } catch (err) {
            alert('Login failed: ' + err.message);
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
        } catch (err) {
            alert('Logout failed: ' + err.message);
        }
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

    // Placeholder methods for other features
    showAddWorkerModal() { alert('Add Worker - Coming soon!'); }
    showEditWorkerModal(id) { alert('Edit Worker - Coming soon!'); }
    showAdvanceModal(id) { alert('Issue Advance - Coming soon!'); }
    showProfile() { alert('Profile - Coming soon!'); }
    async deleteWorker(id) { alert('Delete Worker - Coming soon!'); }
    async setAttendance(workerId, status, date) { 
        alert('Set Attendance - Coming soon!'); 
    }
}
