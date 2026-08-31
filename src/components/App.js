import { supabase } from '../config/supabase.js';
import { Login } from './Login.js';
import { Dashboard } from './Dashboard.js';
import { WorkerTable } from './WorkerTable.js';
import { AttendanceTable } from './AttendanceTable.js';
import { WorkerModal } from './WorkerModal.js';
import { AdvanceModal } from './AdvanceModal.js';
import { ProfilePage } from './ProfilePage.js';
import { LoadingOverlay } from './LoadingOverlay.js';
import { showToast } from '../utils/dom.js';
import { State } from '../lib/state.js';

export class App {
    constructor() {
        this.state = State;
        this.loading = new LoadingOverlay();
        this.components = {
            login: new Login(),
            dashboard: new Dashboard(),
            workerTable: new WorkerTable(),
            attendanceTable: new AttendanceTable(),
            workerModal: new WorkerModal(),
            advanceModal: new AdvanceModal(),
            profilePage: new ProfilePage()
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
            this.loading.show();
            await Promise.all([
                this.loadWorkers(),
                this.loadTodaySummary(),
                this.loadAttendance()
            ]);
        } catch (err) {
            console.error('Load data error:', err);
            showToast('Error loading data', 'error');
        } finally {
            this.loading.hide();
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
        const { data, error } = await supabase
            .rpc('get_today_summary');
        
        if (error) throw error;
        this.state.todaySummary = data || null;
    }

    async loadAttendance() {
        const startDate = this.state.viewMonth + '-01';
        const endDate = this.state.viewMonth + '-' + String(this.getMonthDays(this.state.viewMonth)).padStart(2, '0');
        
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .gte('work_date', startDate)
            .lte('work_date', endDate)
            .order('work_date');
        
        if (error) throw error;
        this.state.attendance = data || [];
    }

    getMonthDays(yearMonth) {
        const [year, month] = yearMonth.split('-').map(Number);
        return new Date(year, month, 0).getDate();
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