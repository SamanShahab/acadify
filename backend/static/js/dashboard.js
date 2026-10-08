/* ==========================================================================
   NEXUS — Dashboard Dynamic Analytics & Real-Time Stats Loader
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Admin Dashboard Stats Fetch
    fetch('/api/dashboard-stats')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                if (data.risk_distribution) {
                    createRiskDistributionChart(
                        'chart-risk-distribution',
                        data.risk_distribution.labels,
                        data.risk_distribution.data,
                        data.risk_distribution.colors
                    );
                }
                if (data.department_comparison) {
                    createDepartmentBarChart(
                        'chart-department-comparison',
                        data.department_comparison.labels,
                        data.department_comparison.students
                    );
                }
                if (data.gpa_distribution) {
                    createDepartmentBarChart(
                        'chart-gpa-distribution',
                        data.gpa_distribution.labels,
                        data.gpa_distribution.data
                    );
                }
            }
        })
        .catch(err => console.log('Admin live stats update notice:', err));

    // 2. Student Portal Dashboard Dynamic Charts
    if (document.getElementById('chart-student-gpa-trend')) {
        createAcademicVelocityChart('chart-student-gpa-trend');
    }

    if (document.getElementById('chart-student-radar')) {
        createRadarSkillChart('chart-student-radar');
    }
});
