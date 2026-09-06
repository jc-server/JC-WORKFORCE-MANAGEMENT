/**
 * SuperLabor - Main Application Entry Point
 * @version 2.0.0
 */

import { App } from './app/App.js';
import { EventBus } from './app/EventBus.js';
import { StateManager } from './app/StateManager.js';
import { ThemeManager } from './components/UI/ThemeToggle.js';

// ========================================
// CONSOLE BANNER
// ========================================
console.log('🚀 SuperLabor Management System v2.0');
console.log('📡 Supabase URL:', window.__SUPABASE_URL__);
console.log('🔑 Supabase Key:', window.__SUPABASE_ANON_KEY__ ? '✅ Loaded' : '❌ Missing');

// ========================================
// INITIALIZE CORE COMPONENTS
// ========================================

// 1. State Manager - Central data store
const stateManager = new StateManager();

// 2. Event Bus - Decoupled communication
const eventBus = new EventBus();

// 3. Theme Manager - Dark/Light mode
const themeManager = new ThemeManager();

// 4. Main Application
const app = new App(stateManager, eventBus);

// ========================================
// BOOTSTRAP APPLICATION
// ========================================

async function bootstrap() {
    try {
        console.log('🔧 Initializing SuperLabor...');
        
        // Initialize app
        await app.init();
        
        console.log('✅ App initialized successfully!');
        console.log(`📊 Workers: ${stateManager.get('workers').length}`);
        console.log(`📅 Month: ${stateManager.get('viewMonth')}`);
        
        // Expose for debugging
        window.__app = app;
        window.__state = stateManager;
        window.__events = eventBus;
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        document.getElementById('app').innerHTML = `
            <div class="error-container" style="padding:2rem;text-align:center;">
                <h1 style="color:#f87171;">⚠️ Application Error</h1>
                <p style="color:#94a3b8;">${error.message}</p>
                <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#fbbf24;border:none;border-radius:0.5rem;cursor:pointer;">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

// ========================================
// NETWORK EVENT HANDLERS
// ========================================

window.addEventListener('online', () => {
    console.log('🌐 Network online');
    app.handleOnline();
    eventBus.emit('network:online');
});

window.addEventListener('offline', () => {
    console.log('📡 Network offline');
    app.handleOffline();
    eventBus.emit('network:offline');
});

// ========================================
// START APPLICATION
// ========================================

bootstrap();