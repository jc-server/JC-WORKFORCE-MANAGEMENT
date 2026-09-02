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
