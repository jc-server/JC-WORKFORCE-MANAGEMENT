// Application state
export const State = {
    user: null,
    workers: [],
    attendance: [],
    todaySummary: null,
    selectedWorkerId: null,
    viewMonth: new Date().toISOString().slice(0, 7),
    editingWorker: null,
};

// State change listeners
const listeners = [];

export function subscribe(listener) {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) listeners.splice(index, 1);
    };
}

export function updateState(newState) {
    Object.assign(State, newState);
    listeners.forEach(listener => listener(State));
}
