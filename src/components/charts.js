
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

export function createTimeline(paycheques, viewMode = 'gross') {
    const container = document.createElement('div');
    container.className = 'card';
    container.style.gridColumn = 'span 12';
    container.style.height = '350px';

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const data = [...paycheques].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get CSS variables for colors
    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--color-primary').trim() || '#4f46e5';
    const textColorMuted = style.getPropertyValue('--color-text-muted').trim() || '#94a3b8';

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, `rgba(79, 70, 229, 0.05)`);
    gradient.addColorStop(1, `rgba(79, 70, 229, 0)`);

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: viewMode === 'gross' ? 'Gross' : (viewMode === 'net' ? 'Net' : 'Rate'),
                data: data.map(d => {
                    if (viewMode === 'gross') return d.gross;
                    if (viewMode === 'net') return (d.net || 0);
                    // For hourly rate in timeline, we might need to calculate it per paycheque
                    return (d.hours + d.otHours) > 0 ? (d.gross / (d.hours + d.otHours)) : 0;
                }),
                borderColor: primaryColor,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: primaryColor,
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColorMuted,
                        font: { family: "'Inter', sans-serif", size: 10 }
                    }
                },
                y: {
                    grid: {
                        color: '#f1f5f9',
                        drawBorder: false
                    },
                    ticks: {
                        color: textColorMuted,
                        font: { family: "'Inter', sans-serif", size: 10 },
                        callback: (value) => '$' + value.toLocaleString()
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#ffffff',
                    titleColor: '#0f172a',
                    bodyColor: '#475569',
                    titleFont: { family: "'Inter', sans-serif", weight: '600' },
                    bodyFont: { family: "'Inter', sans-serif" },
                    padding: 10,
                    cornerRadius: 6,
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    displayColors: false
                }
            }
        }
    });

    return container;
}
