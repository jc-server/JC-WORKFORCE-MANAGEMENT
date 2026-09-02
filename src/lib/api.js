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
