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
