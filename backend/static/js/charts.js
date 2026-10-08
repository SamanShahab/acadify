/* ==========================================================================
   NEXUS — Chart.js Engine & Data Visualization Wrappers (Light Theme)
   ========================================================================== */

Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
Chart.defaults.color = "#64748B";

// 1. Doughnut Chart: Risk Level Segmentation
function createRiskDistributionChart(canvasId, labels, data, colors) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const defaultColors = colors || ['#059669', '#D97706', '#DC2626'];

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels || ['Low Risk', 'Moderate Risk', 'High Risk'],
            datasets: [{
                data: data || [65, 25, 10],
                backgroundColor: defaultColors,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#64748B',
                        font: { size: 12, weight: 500 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#0F172A',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 13, weight: 600 },
                    bodyFont: { size: 12 }
                }
            },
            cutout: '74%'
        }
    });
}

// 2. Bar Chart: Department Comparison
function createDepartmentBarChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels || ['CS', 'EE', 'ME', 'Math', 'Physics'],
            datasets: [{
                label: 'Enrolled Students',
                data: data || [320, 240, 180, 150, 110],
                backgroundColor: 'rgba(37, 99, 235, 0.85)',
                borderColor: '#2563EB',
                borderWidth: 1,
                borderRadius: 8,
                maxBarThickness: 36
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#64748B', font: { size: 11 } },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: '#64748B', font: { size: 11 } },
                    grid: { color: 'rgba(15, 23, 42, 0.06)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0F172A',
                    padding: 12,
                    cornerRadius: 8
                }
            }
        }
    });
}

// 3. Line Chart: Student GPA / Performance Progress Trend
function createAcademicVelocityChart(canvasId, labels, studentData, deptAvgData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels || ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5 (Current)'],
            datasets: [
                {
                    label: 'Student GPA',
                    data: studentData || [3.4, 3.5, 3.6, 3.75, 3.82],
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#2563EB',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 5
                },
                {
                    label: 'Dept Average',
                    data: deptAvgData || [3.1, 3.2, 3.25, 3.3, 3.35],
                    borderColor: '#94A3B8',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.35,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#64748B' }, grid: { display: false } },
                y: {
                    min: 2.0,
                    max: 4.0,
                    ticks: { color: '#64748B', stepSize: 0.5 },
                    grid: { color: 'rgba(15, 23, 42, 0.06)' }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { color: '#64748B', font: { size: 12 }, usePointStyle: true }
                },
                tooltip: { backgroundColor: '#0F172A', padding: 12, cornerRadius: 8 }
            }
        }
    });
}

// 4. Radar Chart: Multi-Vector Competency & Risk Radar
function createRadarSkillChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    return new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels || ['Assignment Velocity', 'Lecture Attendance', 'LMS Engagement', 'Lab Practicals', 'Midterm Progress'],
            datasets: [{
                label: 'Student Metrics',
                data: data || [92, 88, 95, 84, 90],
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                borderColor: '#0284C7',
                borderWidth: 2,
                pointBackgroundColor: '#0284C7',
                pointBorderColor: '#FFFFFF',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(15, 23, 42, 0.08)' },
                    grid: { color: 'rgba(15, 23, 42, 0.08)' },
                    pointLabels: { color: '#475569', font: { size: 11, weight: '600' } },
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#0F172A', padding: 10, cornerRadius: 6 }
            }
        }
    });
}
