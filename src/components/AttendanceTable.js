// AttendanceTable Component
export class AttendanceTable {
    render(state) {
        const monthName = this.getMonthName(state.viewMonth);
        const today = new Date().toISOString().slice(0, 10);
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-calendar-check"></i> 
                        Attendance - ${monthName}
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <button class="btn btn-secondary btn-sm" data-action="prevMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" data-action="nextMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" data-action="todayMonth">
                            Today
                        </button>
                    </div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Worker</th>
                                ${this.getDaysHeader(state.viewMonth)}
                            </tr>
                        </thead>
                        <tbody>
                            ${state.workers.map(worker => `
                                <tr>
                                    <td><strong>${this.escapeHtml(worker.name)}</strong></td>
                                    ${this.getDaysBody(state.viewMonth, worker.id, state.attendance, today)}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getDaysHeader(yearMonth) {
        const [year, month] = yearMonth.split('-').map(Number);
        const days = new Date(year, month, 0).getDate();
        let html = '';
        for (let d = 1; d <= days; d++) {
            const date = new Date(year, month - 1, d);
            const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
            html += `<th style="font-weight:400; font-size:0.7rem; text-align:center;">${d}<br><span style="color:#6b7280;">${dayName}</span></th>`;
        }
        return html;
    }

    getDaysBody(yearMonth, workerId, attendance, today) {
        const [year, month] = yearMonth.split('-').map(Number);
        const days = new Date(year, month, 0).getDate();
        let html = '';
        
        for (let d = 1; d <= days; d++) {
            const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
            const att = attendance.find(a => a.worker_id === workerId && a.work_date === dateStr);
            const status = att ? att.status : '';
            const isToday = dateStr === today;
            
            html += `
                <td style="text-align:center; padding:0.25rem 0.25rem;">
                    ${isToday ? `
                        <div class="attendance-btn-group" style="justify-content:center;">
                            ${['present', 'absent', 'half-day'].map(s => `
                                <button class="attendance-btn attendance-btn-${s} ${status === s ? 'active' : ''}" 
                                        data-action="setAttendance" 
                                        data-worker="${workerId}" 
                                        data-date="${dateStr}" 
                                        data-status="${s}">
                                    ${s === 'present' ? 'P' : s === 'absent' ? 'A' : 'H'}
                                </button>
                            `).join('')}
                        </div>
                    ` : `
                        ${status ? `<span class="${status === 'present' ? 'status-present' : status === 'absent' ? 'status-absent' : 'status-halfday'}" style="font-size:0.7rem;">${status === 'present' ? 'P' : status === 'absent' ? 'A' : 'H'}</span>` : '-'}
                    `}
                    ${att && att.wage_amount > 0 ? `<div style="font-size:0.6rem; color:#6b7280;">₹${att.wage_amount}</div>` : ''}
                </td>
            `;
        }
        return html;
    }

    getMonthName(yearMonth) {
        const [year, month] = yearMonth.split('-').map(Number);
        return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    attachEvents(app) {
        // Navigation
        document.querySelector('[data-action="prevMonth"]')?.addEventListener('click', () => {
            const [year, month] = app.state.viewMonth.split('-').map(Number);
            const newMonth = month - 1;
            const newYear = year + (newMonth === 0 ? -1 : 0);
            const m = newMonth === 0 ? 12 : newMonth;
            app.state.viewMonth = `${newYear}-${String(m).padStart(2, '0')}`;
            app.loadAttendance();
            app.render();
        });
        
        document.querySelector('[data-action="nextMonth"]')?.addEventListener('click', () => {
            const [year, month] = app.state.viewMonth.split('-').map(Number);
            const newMonth = month + 1;
            const newYear = year + (newMonth === 13 ? 1 : 0);
            const m = newMonth === 13 ? 1 : newMonth;
            app.state.viewMonth = `${newYear}-${String(m).padStart(2, '0')}`;
            app.loadAttendance();
            app.render();
        });
        
        document.querySelector('[data-action="todayMonth"]')?.addEventListener('click', () => {
            app.state.viewMonth = new Date().toISOString().slice(0, 7);
            app.loadAttendance();
            app.render();
        });
        
        // Attendance buttons
        document.querySelectorAll('[data-action="setAttendance"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workerId = e.currentTarget.dataset.worker;
                const date = e.currentTarget.dataset.date;
                const status = e.currentTarget.dataset.status;
                app.setAttendance(workerId, status, date);
            });
        });
    }
}
