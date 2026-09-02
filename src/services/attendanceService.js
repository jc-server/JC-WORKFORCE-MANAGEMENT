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
