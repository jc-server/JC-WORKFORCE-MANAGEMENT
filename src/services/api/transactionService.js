import { supabase } from '../../config/supabase.js';

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
    },

    async getByDateRange(startDate, endDate, workerId = null) {
        let query = supabase
            .from('worker_transactions')
            .select('*')
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate)
            .order('transaction_date', { ascending: false });
        
        if (workerId) {
            query = query.eq('worker_id', workerId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getSummary(workerId = null) {
        let query = supabase
            .from('worker_transactions')
            .select('transaction_type, amount');
        
        if (workerId) {
            query = query.eq('worker_id', workerId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const summary = {
            wages: data.filter(t => t.transaction_type === 'wage').reduce((sum, t) => sum + t.amount, 0),
            advances: data.filter(t => t.transaction_type === 'advance').reduce((sum, t) => sum + t.amount, 0),
            payments: data.filter(t => t.transaction_type === 'payment').reduce((sum, t) => sum + t.amount, 0),
            adjustments: data.filter(t => t.transaction_type === 'adjustment').reduce((sum, t) => sum + t.amount, 0)
        };
        
        summary.netBalance = summary.wages - summary.advances - summary.payments;
        return summary;
    },

    async getWorkerBalance(workerId) {
        const { data, error } = await supabase
            .from('worker_transactions')
            .select('transaction_type, amount')
            .eq('worker_id', workerId);
        
        if (error) throw error;
        
        const wages = data.filter(t => t.transaction_type === 'wage').reduce((sum, t) => sum + t.amount, 0);
        const advances = data.filter(t => t.transaction_type === 'advance').reduce((sum, t) => sum + t.amount, 0);
        const payments = data.filter(t => t.transaction_type === 'payment').reduce((sum, t) => sum + t.amount, 0);
        
        return { wages, advances, payments, balance: wages - advances - payments };
    }
};