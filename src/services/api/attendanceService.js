import { supabase } from '../../config/supabase.js';

export const attendanceService = {
    async setAttendance({ workerId, date, status, wageAmount, paymentAmount = 0 }) {
        const { data, error } = await supabase
            .rpc('apply_attendance_with_payment', {
                p_worker_id: workerId,
                p_work_date: date,
                p_status: status,
                p_wage_amount: wageAmount,
                p_payment_amount: paymentAmount
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
    },

    async getWorkerAttendance(workerId, month) {
        let query = supabase
            .from('attendance')
            .select('*')
            .eq('worker_id', workerId)
            .order('work_date', { ascending: false });
        
        if (month) {
            const startDate = month + '-01';
            const endDate = month + '-31';
            query = query.gte('work_date', startDate).lte('work_date', endDate);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async updatePayment(workerId, date, paymentAmount) {
        const { data, error } = await supabase
            .from('attendance')
            .update({ payment_amount: paymentAmount })
            .eq('worker_id', workerId)
            .eq('work_date', date)
            .select();
        
        if (error) throw error;
        return data;
    },

    async getAttendanceStats(month) {
        const startDate = month + '-01';
        const endDate = month + '-31';
        
        const { data, error } = await supabase
            .from('attendance')
            .select('status, worker_id')
            .gte('work_date', startDate)
            .lte('work_date', endDate);
        
        if (error) throw error;
        
        const stats = {
            present: data.filter(a => a.status === 'present').length,
            absent: data.filter(a => a.status === 'absent').length,
            halfday: data.filter(a => a.status === 'half-day').length,
            total: data.length
        };
        
        return stats;
    }
};