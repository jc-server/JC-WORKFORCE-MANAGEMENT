import { App } from './components/App.js?v=20240831';

console.log('🚀 Jaiswal Workforce Management System loaded!');
console.log('📦 Version: 20240831');

// Initialize the app
const app = new App();
app.init();

// Expose app globally for debugging
window.__app = app;
