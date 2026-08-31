export function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getStatusBadge(status) {
    const map = {
        'present': '<span class="badge badge-success">Present</span>',
        'absent': '<span class="badge badge-danger">Absent</span>',
        'half-day': '<span class="badge badge-warning">Half Day</span>'
    };
    return map[status] || '<span class="badge badge-secondary">Unknown</span>';
}

export function getStatusClass(status) {
    const map = { 
        'present': 'status-present', 
        'absent': 'status-absent', 
        'half-day': 'status-halfday' 
    };
    return map[status] || '';
}

export function getMonthDays(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
}

export function getMonthName(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function getToday() {
    return new Date().toISOString().slice(0, 10);
}

export function isToday(dateStr) {
    return dateStr === getToday();
}