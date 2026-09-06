export class EventBus {
    constructor() {
        this.events = new Map();
        this.history = [];
        this.maxHistory = 100;
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        // Log event for debugging
        this.logEvent(event, data);
        
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`Error in event ${event}:`, err);
                }
            });
        }
    }

    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    logEvent(event, data) {
        this.history.push({ 
            event, 
            data, 
            timestamp: new Date().toISOString() 
        });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        this.history = [];
    }
}