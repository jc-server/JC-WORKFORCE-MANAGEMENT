import { supabase } from '../../config/supabase.js';

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

    async getById(id) {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    async create(workerData) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('workers')
            .insert({
                owner_id: user.id,
                name: workerData.name.trim(),
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
            .update({
                name: updates.name?.trim(),
                role: updates.role || 'Worker',
                daily_rate: parseFloat(updates.daily_rate) || 0
            })
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
    },

    async getWithBalance(id) {
        const { data, error } = await supabase
            .from('worker_financial_summary')
            .select('*')
            .eq('worker_id', id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async search(query) {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('active', true)
            .or(`name.ilike.%${query}%,role.ilike.%${query}%`)
            .order('name');
        
        if (error) throw error;
        return data;
    },

    async getStatistics() {
        const { data, error } = await supabase
            .from('workers')
            .select('id, name, daily_rate')
            .eq('active', true);
        
        if (error) throw error;
        
        return {
            total: data.length,
            totalDailyWage: data.reduce((sum, w) => sum + (w.daily_rate || 0), 0),
            averageDailyRate: data.length > 0 ? data.reduce((sum, w) => sum + (w.daily_rate || 0), 0) / data.length : 0
        };
    }
};