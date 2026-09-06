export class AttendanceCalendar {
    render(state) {
        const month = state.viewMonth;
        const [year, mon] = month.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();
        const firstDay = new Date(year, mon - 1, 1).getDay();
        const today = new Date().toISOString().slice(0, 10);
        
        const workers = state.workers.filter(w => w.active !== false);
        const attendance = state.attendance;
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-calendar"></i> Attendance Calendar
                    </div>
                    <div class="calendar-nav">
                        <button class="btn btn-secondary btn-sm" data-action="prevMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <h3 class="calendar-month">${this.getMonthName(month)}</h3>
                        <button class="btn btn-secondary btn-sm" data-action="nextMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-primary btn-sm" data-action="todayMonth">
                            Today
                        </button>
                    </div>
                </div>
                
                <div class="calendar-grid">
                    <!-- Day headers -->
                    <div class="calendar-header">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                            `<div class="calendar-cell header">${day}</div>`
                        ).join('')}
                    </div>
                    
                    <!-- Calendar body -->
                    <div class="calendar-body">
                        ${this.renderCalendarDays(year, mon, daysInMonth, firstDay, today, workers, attendance)}
                    </div>
                </div>
                
                <!-- Legend -->
                <div class="calendar-legend">
                    <span class="legend-item">
                        <span class="legend-color present"></span> Present
                    </span>
                    <span class="legend-item">
                        <span class="legend-color absent"></span> Absent
                    </span>
                    <span class="legend-item">
                        <span class="legend-color halfday"></span> Half Day
                    </span>
                    <span class="legend-item">
                        <span class="legend-color today"></span> Today
                    </span>
                </div>
            </div>
        `;
    }

    renderCalendarDays(year, mon, daysInMonth, firstDay, today, workers, attendance) {
        let html = '';
        
        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-cell empty"></div>`;
        }
        
        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === today;
            
            // Get attendance for this day
            const dayAttendance = attendance.filter(a => a.work_date === dateStr);
            const present = dayAttendance.filter(a => a.status === 'present').length;
            const absent = dayAttendance.filter(a => a.status === 'absent').length;
            const halfday = dayAttendance.filter(a => a.status === 'half-day').length;
            const total = workers.length;
            
            let statusClass = '';
            if (total > 0) {
                const rate = present / total;
                if (rate === 1) statusClass = 'full';
                else if (rate >= 0.5) statusClass = 'partial';
                else if (rate > 0) statusClass = 'low';
                else statusClass = 'none';
            }
            
            html += `
                <div class="calendar-cell day ${isToday ? 'today' : ''} ${statusClass}" 
                     data-date="${dateStr}">
                    <span class="day-number">${d}</span>
                    ${total > 0 ? `
                        <div class="day-stats">
                            <span class="stat present">${present}</span>
                            <span class="stat absent">${absent}</span>
                            <span class="stat halfday">${halfday}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        return html;
    }

    getMonthName(month) {
        const [year, mon] = month.split('-').map(Number);
        return new Date(year, mon - 1).toLocaleString('en-IN', { 
            month: 'long', 
            year: 'numeric' 
        });
    }

    attachEvents(app) {
        document.querySelector('[data-action="prevMonth"]')?.addEventListener('click', () => {
            const current = app.state.get('viewMonth');
            const [year, mon] = current.split('-').map(Number);
            const newMon = mon - 1;
            const newYear = newMon === 0 ? year - 1 : year;
            const newMonth = newMon === 0 ? 12 : newMon;
            const month = `${newYear}-${String(newMonth).padStart(2, '0')}`;
            app.state.set('viewMonth', month);
            app.reloadData();
        });
        
        document.querySelector('[data-action="nextMonth"]')?.addEventListener('click', () => {
            const current = app.state.get('viewMonth');
            const [year, mon] = current.split('-').map(Number);
            const newMon = mon + 1;
            const newYear = newMon === 13 ? year + 1 : year;
            const newMonth = newMon === 13 ? 1 : newMon;
            const month = `${newYear}-${String(newMonth).padStart(2, '0')}`;
            app.state.set('viewMonth', month);
            app.reloadData();
        });
        
        document.querySelector('[data-action="todayMonth"]')?.addEventListener('click', () => {
            const month = new Date().toISOString().slice(0, 7);
            app.state.set('viewMonth', month);
            app.reloadData();
        });
        
        // Click on day to show details
        document.querySelectorAll('.calendar-cell.day').forEach(cell => {
            cell.addEventListener('click', () => {
                const date = cell.dataset.date;
                if (date) {
                    app.events.emit('calendar:dayClick', { date });
                }
            });
        });
    }
}