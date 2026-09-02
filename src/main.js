import { App } from './components/App.js';

console.log('🚀 Jaiswal Workforce Management System started!');

// Initialize the app
const app = new App();
app.init();

// Expose app globally for debugging
window.__app = app;
