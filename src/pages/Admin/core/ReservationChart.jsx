import React from 'react';
import { Bar } from 'react-chartjs-2';
import { FaChartBar } from 'react-icons/fa';

const ReservationChart = () => {
    const currentMonth = new Date().getMonth();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Sample monthly data
    const data = {
        labels: months,
        datasets: [
            {
                label: 'Total Reservations',
                data: [45, 52, 38, 60, 42, 50, 48, 55, 42, 47, 40, 35],
                backgroundColor: months.map((_, index) => 
                    index === currentMonth 
                        ? 'rgba(34, 197, 94, 0.8)' // Current month (brighter)
                        : 'rgba(34, 197, 94, 0.4)' // Other months (dimmer)
                ),
                borderColor: months.map((_, index) => 
                    index === currentMonth 
                        ? 'rgb(22, 163, 74)' // Current month (darker border)
                        : 'rgb(34, 197, 94)' // Other months
                ),
                borderWidth: months.map((_, index) => 
                    index === currentMonth ? 2 : 1
                ),
                borderRadius: 5,
                barThickness: 35,
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Hide legend since we have header
            },
            title: {
                display: false, // Hide title since we have header
            },
            tooltip: {
                callbacks: {
                    title: (tooltipItems) => {
                        const monthIndex = tooltipItems[0].dataIndex;
                        return `${months[monthIndex]}${monthIndex === currentMonth ? ' (Current Month)' : ''}`;
                    },
                    label: (context) => {
                        return `Total Reservations: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 10,
                    font: {
                        size: 11
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)',
                },
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    callback: function(val, index) {
                        // On smaller screens, show shorter month names
                        return window.innerWidth < 768 ? months[index].substr(0, 1) : months[index].substr(0, 3);
                    },
                    font: {
                        size: 11
                    }
                }
            },
        },
    };

    return (
        <div className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700 h-full">
            <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
                <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
                    <FaChartBar className="mr-2 text-sm md:text-base" /> Reservation Trends
                </h2>
                <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
                    {months[currentMonth]}
                </div>
            </div>
            <div className="p-3 md:p-4">
                <div className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                    <Bar 
                        data={data} 
                        options={{
                            ...options,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                ...options.plugins,
                                tooltip: {
                                    ...options.plugins.tooltip,
                                    padding: 10,
                                    titleFont: {
                                        size: 13
                                    },
                                    bodyFont: {
                                        size: 12
                                    }
                                }
                            },
                            scales: {
                                ...options.scales,
                                y: {
                                    ...options.scales.y,
                                    ticks: {
                                        ...options.scales.y.ticks,
                                        font: {
                                            size: window.innerWidth < 768 ? 10 : 11
                                        },
                                        maxTicksLimit: window.innerWidth < 768 ? 5 : 8
                                    }
                                },
                                x: {
                                    ...options.scales.x,
                                    ticks: {
                                        ...options.scales.x.ticks,
                                        font: {
                                            size: window.innerWidth < 768 ? 10 : 11
                                        },
                                        maxRotation: window.innerWidth < 768 ? 45 : 0,
                                        callback: function(val, index) {
                                            if (window.innerWidth < 640) {
                                                return months[index].substr(0, 1);
                                            } else if (window.innerWidth < 768) {
                                                return months[index].substr(0, 2);
                                            }
                                            return months[index].substr(0, 3);
                                        }
                                    }
                                }
                            }
                        }} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ReservationChart;
