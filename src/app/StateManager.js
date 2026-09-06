export class StateManager {
    constructor() {
        this.state = {
            user: null,
            workers: [],
            attendance: [],
            transactions: [],
            documents: [],
            scheduledPayments: [],
            todaySummary: null,
            viewMonth: new Date().toISOString().slice(0, 7),
            selectedWorkerId: null,
            isLoading: false,
            isOffline: !navigator.onLine,
            theme: 'dark',
            notifications: [],
            lastSync: null,
            filters: {
                search: '',
                status: 'all',
                dateRange: null
            }
        };
        
        this.listeners = [];
        this.cache = new Map();
        this.loadFromCache();
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem('superlabor_state');
            if (cached) {
                const parsed = JSON.parse(cached);
                this.state = { ...this.state, ...parsed };
                this.state.isOffline = !navigator.onLine;
            }
        } catch (e) {
            console.warn('Could not load cache:', e);
        }
    }

    saveToCache() {
        try {
            const toCache = {
                ...this.state,
                isLoading: false,
                lastSync: new Date().toISOString()
            };
            localStorage.setItem('superlabor_state', JSON.stringify(toCache));
        } catch (e) {
            console.warn('Could not save cache:', e);
        }
    }

    getState() {
        return this.state;
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
        this.saveToCache();
    }

    set(key, value) {
        this.state[key] = value;
        this.notify();
        this.saveToCache();
    }

    get(key) {
        return this.state[key];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index !== -1) this.listeners.splice(index, 1);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    clearCache() {
        localStorage.removeItem('superlabor_state');
        this.cache.clear();
    }

    // Computed getters
    get totalWorkers() {
        return this.state.workers.filter(w => w.active !== false).length;
    }

    get activeWorkers() {
        return this.state.workers.filter(w => w.active !== false);
    }

    get todayAttendance() {
        const today = new Date().toISOString().slice(0, 10);
        return this.state.attendance.filter(a => a.work_date === today);
    }

    get presentCount() {
        return this.todayAttendance.filter(a => a.status === 'present').length;
    }

    get totalWages() {
        return this.state.attendance.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
    }

    get totalAdvances() {
        return this.state.transactions
            .filter(t => t.transaction_type === 'advance')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    get totalPaid() {
        return this.state.transactions
            .filter(t => t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    get netBalance() {
        return this.totalWages - this.totalAdvances - this.totalPaid;
    }

    getWorkerBalance(workerId) {
        const workerAtt = this.state.attendance.filter(a => a.worker_id === workerId);
        const workerTxns = this.state.transactions.filter(t => t.worker_id === workerId);
        
        const wages = workerAtt.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
        const advances = workerTxns
            .filter(t => t.transaction_type === 'advance')
            .reduce((sum, t) => sum + t.amount, 0);
        const payments = workerTxns
            .filter(t => t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            wages,
            advances,
            payments,
            balance: wages - advances - payments
        };
    }

    getWorkerAttendance(workerId, month = null) {
        const targetMonth = month || this.state.viewMonth;
        return this.state.attendance.filter(a => 
            a.worker_id === workerId && 
            a.work_date.startsWith(targetMonth)
        );
    }

    getMonthAttendance(month) {
        return this.state.attendance.filter(a => a.work_date.startsWith(month));
    }

    getWorkerTransactions(workerId) {
        return this.state.transactions
            .filter(t => t.worker_id === workerId)
            .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    }
}