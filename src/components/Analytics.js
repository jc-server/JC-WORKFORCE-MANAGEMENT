export class Analytics {
    render(state) {
        const workers = state.workers.filter(w => w.active !== false);
        const attendance = state.attendance || [];
        const transactions = state.transactions || [];
        const month = state.viewMonth;
        
        // Calculate metrics
        const totalWorkers = workers.length;
        const totalDays = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
        const monthAttendance = attendance.filter(a => a.work_date.startsWith(month));
        const totalPresent = monthAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalWorkers > 0 && totalDays > 0 
            ? Math.round((totalPresent / (totalWorkers * totalDays)) * 100) 
            : 0;
        
        // Worker performance
        const workerPerformance = workers.map(w => {
            const wAtt = attendance.filter(a => a.worker_id === w.id && a.work_date.startsWith(month));
            const present = wAtt.filter(a => a.status === 'present').length;
            const absent = wAtt.filter(a => a.status === 'absent').length;
            const halfday = wAtt.filter(a => a.status === 'half-day').length;
            const rate = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
            const wages = wAtt.reduce((sum, a) => sum + (a.wage_amount || 0), 0);
            
            return { ...w, present, absent, halfday, rate, wages };
        }).sort((a, b) => b.rate - a.rate);
        
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-chart-line"></i> Analytics & Reports
                    </div>
                    <div class="analytics-actions">
                        <button class="btn btn-secondary btn-sm" data-action="refreshAnalytics">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>
                </div>
                
                <!-- Summary Stats -->
                <div class="analytics-summary">
                    <div class="stat-card">
                        <div class="stat-label">Attendance Rate</div>
                        <div class="stat-value" style="color:${attendanceRate >= 70 ? '#4ade80' : attendanceRate >= 50 ? '#fbbf24' : '#f87171'}">
                            ${attendanceRate}%
                        </div>
                        <div class="stat-sub">${month}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Work Days</div>
                        <div class="stat-value">${totalDays}</div>
                        <div class="stat-sub">This month</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Present</div>
                        <div class="stat-value">${totalPresent}</div>
                        <div class="stat-sub">Man-days this month</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Avg Daily Present</div>
                        <div class="stat-value">${totalDays > 0 ? Math.round(totalPresent / totalDays) : 0}</div>
                        <div class="stat-sub">Workers per day</div>
                    </div>
                </div>
                
                <!-- Worker Performance Table -->
                <h4>Worker Performance</h4>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Worker</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Half Day</th>
                                <th>Rate</th>
                                <th>Wages</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workerPerformance.map(w => `
                                <tr>
                                    <td>
                                        <strong>${this.escapeHtml(w.name)}</strong>
                                        <span class="badge badge-secondary">${this.escapeHtml(w.role || 'Worker')}</span>
                                    </td>
                                    <td style="color:#4ade80;">${w.present}</td>
                                    <td style="color:#f87171;">${w.absent}</td>
                                    <td style="color:#fbbf24;">${w.halfday}</td>
                                    <td>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${w.rate}%; background: ${w.rate >= 70 ? '#4ade80' : w.rate >= 50 ? '#fbbf24' : '#f87171'};">
                                                ${w.rate}%
                                            </div>
                                        </div>
                                    </td>
                                    <td>₹${w.wages.toLocaleString()}</td>
                                    <td>
                                        <span class="badge ${w.rate >= 70 ? 'badge-success' : w.rate >= 50 ? 'badge-warning' : 'badge-danger'}">
                                            ${w.rate >= 70 ? 'Good' : w.rate >= 50 ? 'Average' : 'Needs Improvement'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <!-- Chart Container -->
                <div class="chart-container">
                    <canvas id="attendanceChart"></canvas>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    attachEvents(app) {
        document.querySelector('[data-action="refreshAnalytics"]')?.addEventListener('click', () => {
            app.reloadData();
        });
        
        // Initialize chart after render
        setTimeout(() => this.renderChart(app), 100);
    }

    renderChart(app) {
        const canvas = document.getElementById('attendanceChart');
        if (!canvas) return;
        
        const state = app.state.getState();
        const workers = state.workers.filter(w => w.active !== false);
        const attendance = state.attendance || [];
        const month = state.viewMonth;
        
        // Get daily attendance data
        const daysInMonth = new Date(
            parseInt(month.split('-')[0]), 
            parseInt(month.split('-')[1]), 
            0
        ).getDate();
        
        const dailyData = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${month}-${String(d).padStart(2, '0')}`;
            const dayAttendance = attendance.filter(a => a.work_date === dateStr);
            const present = dayAttendance.filter(a => a.status === 'present').length;
            const absent = dayAttendance.filter(a => a.status === 'absent').length;
            const halfday = dayAttendance.filter(a => a.status === 'half-day').length;
            dailyData.push({ date: d, present, absent, halfday });
        }
        
        // Destroy existing chart
        if (window._attendanceChart) {
            window._attendanceChart.destroy();
        }
        
        // Create chart
        const ctx = canvas.getContext('2d');
        window._attendanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dailyData.map(d => d.date),
                datasets: [
                    {
                        label: 'Present',
                        data: dailyData.map(d => d.present),
                        backgroundColor: 'rgba(74, 222, 128, 0.6)',
                        borderColor: 'rgba(74, 222, 128, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Absent',
                        data: dailyData.map(d => d.absent),
                        backgroundColor: 'rgba(248, 113, 113, 0.6)',
                        borderColor: 'rgba(248, 113, 113, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Half Day',
                        data: dailyData.map(d => d.halfday),
                        backgroundColor: 'rgba(251, 191, 36, 0.6)',
                        borderColor: 'rgba(251, 191, 36, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Daily Attendance - ' + month,
                        color: '#e2e8f0'
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        ticks: { color: '#94a3b8' },
                        beginAtZero: true,
                        stacked: true
                    }
                }
            }
        });
    }
}