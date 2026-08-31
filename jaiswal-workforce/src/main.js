import { App } from './components/App.js';
import { supabase } from './config/supabase.js';

// Initialize the app
const app = new App();
app.init();

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        app.loadData();
        app.render();
    } else if (event === 'SIGNED_OUT') {
        app.state.user = null;
        app.state.workers = [];
        app.state.attendance = [];
        app.render();
    }
});