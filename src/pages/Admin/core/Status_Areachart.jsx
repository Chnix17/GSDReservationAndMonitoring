import React, { useEffect, useRef, useMemo } from 'react';
import * as Chart from 'chart.js';
import { FaChartArea } from 'react-icons/fa';

const SimpleAreaChart = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const currentMonth = new Date().getMonth();
  
  const months = useMemo(() => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], []);

  const data = useMemo(() => ({
    labels: months,
    datasets: [
      {
        label: 'Completed',
        data: [120, 150, 180, 200, 240, 320, 350, 300, 280, 260, 220, 190],
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
          gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
          return gradient;
        },
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
      {
        label: 'Cancelled',
        data: [30, 45, 35, 50, 40, 55, 80, 65, 55, 45, 50, 40],
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
          return gradient;
        },
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      }
    ]
  }), [months]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: '#64748b',
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: (tooltipItems) => {
            const monthIndex = tooltipItems[0].dataIndex;
            return `${months[monthIndex]}${monthIndex === currentMonth ? ' (Current Month)' : ''}`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          },
          callback: function(val, index) {
            return window.innerWidth < 768 ? months[index].substr(0, 1) : months[index];
          }
        },
        border: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11
          },
          stepSize: 50
        },
        border: {
          display: false
        }
      }
    }
  }), [months, currentMonth]);

  useEffect(() => {
    if (chartRef.current) {
      Chart.Chart.register(
        Chart.CategoryScale,
        Chart.LinearScale,
        Chart.PointElement,
        Chart.LineElement,
        Chart.Title,
        Chart.Tooltip,
        Chart.Legend,
        Chart.Filler
      );

      const ctx = chartRef.current.getContext('2d');
      
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const responsiveOptions = {
        ...options,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          ...options.plugins,
          legend: {
            ...options.plugins.legend,
            labels: {
              ...options.plugins.legend.labels,
              font: {
                size: window.innerWidth < 768 ? 10 : 11
              },
              boxWidth: window.innerWidth < 768 ? 8 : 12,
              padding: window.innerWidth < 768 ? 15 : 20
            }
          },
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
                return months[index];
              }
            }
          },
          y: {
            ...options.scales.y,
            ticks: {
              ...options.scales.y.ticks,
              font: {
                size: window.innerWidth < 768 ? 10 : 11
              },
              maxTicksLimit: window.innerWidth < 768 ? 5 : 8
            }
          }
        }
      };

      chartInstance.current = new Chart.Chart(ctx, {
        type: 'line',
        data: data,
        options: responsiveOptions
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, months, options]);

  return (
    <div className="bg-[#fafff4] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800/90 dark:border-gray-700 h-full">
      <div className="bg-gradient-to-r from-lime-900 to-green-900 p-3 md:p-4 flex justify-between items-center">
        <h2 className="text-white text-base md:text-lg font-semibold flex items-center">
          <FaChartArea className="mr-2 text-sm md:text-base" /> Status Overview
        </h2>
        <div className="bg-white/30 px-2 py-1 rounded-md text-xs font-medium text-white">
          {months[currentMonth]}
        </div>
      </div>
      <div className="p-3 md:p-4">
        <div className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default SimpleAreaChart;