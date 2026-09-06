import { App } from './app/App.js';
import { EventBus } from './app/EventBus.js';
import { StateManager } from './app/StateManager.js';
import { ThemeManager } from './components/UI/ThemeToggle.js';

console.log('🚀 SuperLabor Management System v2.0 started!');

// Initialize State Manager
const stateManager = new StateManager();

// Initialize Event Bus
const eventBus = new EventBus();

// Initialize Theme Manager
const themeManager = new ThemeManager();

// Initialize App
const app = new App(stateManager, eventBus);
app.init();

// Expose for debugging
window.__app = app;
window.__state = stateManager;
window.__events = eventBus;

// Handle offline/online events
window.addEventListener('online', () => {
    app.handleOnline();
    eventBus.emit('network:online');
});

window.addEventListener('offline', () => {
    app.handleOffline();
    eventBus.emit('network:offline');
});

console.log('✅ App initialized successfully!');