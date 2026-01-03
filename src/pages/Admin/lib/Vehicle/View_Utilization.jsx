import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Drawer, Statistic, Spin, Tabs, Typography, Space, Tag, Table } from 'antd';
import { CarOutlined, ToolOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { SecureStorage } from '../../../../utils/encryption';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
    Legend as ChartLegend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ChartTitle,
    ChartTooltip,
    ChartLegend
);

const { Title, Text } = Typography;

const View_Utilization = ({ open, onCancel, vehicle, IMAGE_BASE_URL }) => {
    const [loading, setLoading] = useState(true);
    const [utilizationData, setUtilizationData] = useState(null);
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const encryptedUrl = SecureStorage.getLocalItem("url");

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    const COLORS = ['#548e54', '#83b383'];

    const [historyLoading, setHistoryLoading] = useState(false);
    const [reservationHistory, setReservationHistory] = useState([]);

    const processUtilizationData = useCallback((data) => {
        const { usage_statistics, reservations } = data;
        
        // Initialize all months of the year
        const allMonths = moment.months().map(month => moment().month(month).format('MMM'));
        const monthlyData = {};
        
        // Initialize all months with zero values
        allMonths.forEach(month => {
            monthlyData[month] = {
                utilizations: 0,
                issues: 0
            };
        });

        // Process reservations for utilizations
        reservations.forEach(reservation => {
            const month = moment(reservation.reservation_start_date).format('MMM');
            monthlyData[month].utilizations++;
        });

        // Calculate total issues from usage statistics
        const totalIssues = usage_statistics.broken_count + usage_statistics.missing_count;
        
        // Distribute issues proportionally across months based on utilization
        const totalUtilizations = usage_statistics.total_usage;
        if (totalUtilizations > 0) {
            allMonths.forEach(month => {
                const monthUtilizations = monthlyData[month].utilizations;
                monthlyData[month].issues = Math.round((monthUtilizations / totalUtilizations) * totalIssues);
            });
        }

        const avgUsageTime = calculateAverageUsageTime(reservations);
        const successRate = usage_statistics.total_usage > 0 
            ? ((usage_statistics.good_condition_count / usage_statistics.total_usage) * 100).toFixed(1)
            : 0;

        setUtilizationData({
            totalUtilizations: usage_statistics.total_usage,
            totalIssues: totalIssues,
            avgUtilizationTime: avgUsageTime,
            successRate: successRate,
            monthlyUtilization: allMonths.map(month => ({
                month,
                utilizations: monthlyData[month].utilizations,
                issues: monthlyData[month].issues
            }))
        });
    }, []);

    useEffect(() => {
        const fetchUtilizationData = async () => {
            if (open && vehicle?.vehicle_id) {
                setLoading(true);
                try {
                    const response = await axios.post(
                        `${encryptedUrl}/Assigned&Records.php`,
                        {
                            operation: "getVehicleUsage",
                            vehicleId: vehicle.vehicle_id
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (response.data.status === 'success') {
                        setVehicleDetails(response.data.data.vehicle_details);
                        processUtilizationData(response.data.data);
                    }
                } catch (error) {
                    console.error('Error fetching utilization data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        const fetchReservationHistory = async () => {
            if (open && vehicle?.vehicle_id) {
                setHistoryLoading(true);
                try {
                    const response = await axios.post(
                        `${encryptedUrl}/Assigned&Records.php`,
                        {
                            operation: "fetchVehicleHistory",
                            vehicle_id: vehicle.vehicle_id // <-- changed from vehicleId to vehicle_id
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    if (response.data.status === 'success') {
                        setReservationHistory(response.data.data || []);
                    } else {
                        setReservationHistory([]);
                    }
                } catch (error) {
                    setReservationHistory([]);
                } finally {
                    setHistoryLoading(false);
                }
            }
        };

        if (open && vehicle?.vehicle_id) {
            fetchUtilizationData();
            fetchReservationHistory();
        }
    }, [open, vehicle, encryptedUrl, processUtilizationData]);

    const calculateAverageUsageTime = (reservations) => {
        if (!reservations || reservations.length === 0) return 0;

        const totalHours = reservations.reduce((acc, reservation) => {
            const start = moment(reservation.reservation_start_date);
            const end = moment(reservation.reservation_end_date);
            const duration = moment.duration(end.diff(start));
            return acc + duration.asHours();
        }, 0);

        return (totalHours / reservations.length).toFixed(1);
    };

    const renderMonthlyUtilizationChart = () => {
        if (!utilizationData?.monthlyUtilization) return null;

        const chartData = {
            labels: utilizationData.monthlyUtilization.map(item => item.month),
            datasets: [
                {
                    label: 'Utilizations',
                    data: utilizationData.monthlyUtilization.map(item => item.utilizations),
                    backgroundColor: COLORS[0],
                    borderRadius: 4,
                    maxBarThickness: 35,
                },
                {
                    label: 'Issues',
                    data: utilizationData.monthlyUtilization.map(item => item.issues),
                    backgroundColor: COLORS[1],
                    borderRadius: 4,
                    maxBarThickness: 35,
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12
                        },
                        color: '#333333'
                    }
                },
                tooltip: {
                    backgroundColor: '#d4f4dc',
                    titleColor: '#333333',
                    bodyColor: '#333333',
                    borderColor: '#83b383',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    usePointStyle: true,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: (context) => context[0].label,
                        label: (context) => {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        color: '#f0f0f0',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        padding: 8,
                        stepSize: 5
                    },
                    beginAtZero: true,
                    max: 50,
                    min: 0
                }
            },
            barPercentage: 0.8,
            categoryPercentage: 0.9
        };

        return (
            <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
                <Bar data={chartData} options={options} />
            </div>
        );
    };

    // Responsive table columns
    const getReservationColumns = () => {
        const baseColumns = [
            {
                title: 'Vehicle',
                dataIndex: 'vehicle_model_name',
                key: 'vehicle_model_name',
                width: isMobile ? 120 : 150,
            },
            {
                title: 'Requester',
                dataIndex: 'requester',
                key: 'requester',
                width: isMobile ? 100 : 120,
            },
            {
                title: 'Start Date',
                dataIndex: 'reservation_start_date',
                key: 'reservation_start_date',
                render: (text) => text ? moment(text).format(isMobile ? 'MMM D h:mm A' : 'MMMM D h:mm A') : '',
                width: isMobile ? 120 : 160,
            },
        ];

        // Add additional columns for tablet and desktop
        if (!isMobile) {
            baseColumns.splice(1, 0, 
                {
                    title: 'Category',
                    dataIndex: 'vehicle_category_name',
                    key: 'vehicle_category_name',
                    width: 120,
                },
                {
                    title: 'License',
                    dataIndex: 'vehicle_license',
                    key: 'vehicle_license',
                    width: 100,
                }
            );
        }

        if (isDesktop) {
            baseColumns.splice(2, 0, {
                title: 'Make',
                dataIndex: 'vehicle_make_name',
                key: 'vehicle_make_name',
                width: 100,
            });
            
            baseColumns.push(
                {
                    title: 'End Date',
                    dataIndex: 'reservation_end_date',
                    key: 'reservation_end_date',
                    render: (text) => text ? moment(text).format('MMMM D h:mm A') : '',
                    width: 160,
                },
                {
                    title: 'Driver',
                    dataIndex: 'driver_name',
                    key: 'driver_name',
                    render: (text) => text || <span style={{ color: '#aaa' }}>N/A</span>,
                    width: 120,
                }
            );
        }

        return baseColumns;
    };

    const renderReservationHistory = () => (
        <div className={`${isMobile ? 'p-2' : 'p-4'}`} style={{ minHeight: isMobile ? '300px' : '500px' }}>
            <Table
                columns={getReservationColumns()}
                dataSource={reservationHistory.map((item, idx) => ({ ...item, key: idx }))}
                loading={historyLoading}
                pagination={{ 
                    pageSize: isMobile ? 5 : isTablet ? 6 : 8,
                    simple: isMobile,
                    size: isMobile ? 'small' : 'default'
                }}
                locale={{ emptyText: historyLoading ? 'Loading...' : 'No reservation history found.' }}
                bordered={!isMobile}
                size={isMobile ? 'small' : 'middle'}
                scroll={{ x: isMobile ? 400 : 'auto' }}
            />
        </div>
    );

    const items = [
        {
            key: '1',
            label: <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>{isMobile ? 'Overview' : 'Monthly Overview'}</span>,
            children: (
                <div className={`${isMobile ? 'p-2' : 'p-4'}`} style={{ minHeight: isMobile ? '300px' : '500px' }}>
                    {renderMonthlyUtilizationChart()}
                </div>
            ),
        },
        {
            key: '2',
            label: <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>{isMobile ? 'History' : 'Reservation History'}</span>,
            children: renderReservationHistory(),
        }
    ];

    const renderContent = () => (
        <>
            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Spin size="large" />
                </div>
            ) : vehicleDetails && (
                <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                    {/* Vehicle Info Section */}
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-3 ${isMobile ? 'p-2' : 'p-3'}`} style={{ backgroundColor: '#d4f4dc' }}>
                        <div>
                            <Title level={isMobile ? 5 : 4} className={`!mb-2 ${isMobile ? '!text-sm' : '!text-base md:!text-lg'}`}>
                                {vehicleDetails.vehicle_make_name} {vehicleDetails.vehicle_model_name}
                            </Title>
                            <Text style={{ color: '#333333' }} className={`block ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
                                <span className="font-medium">License:</span> {vehicleDetails.vehicle_license}
                            </Text>
                        </div>
                        {!isMobile && (
                            <>
                                <div>
                                    <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                        <span className="font-medium">Category:</span> {vehicleDetails.vehicle_category_name}
                                    </Text>
                                    <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                        <span className="font-medium">Year:</span> {vehicleDetails.year}
                                    </Text>
                                </div>
                                <div>
                                    <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                        <span className="font-medium">Status:</span>{' '}
                                        <Tag color={vehicleDetails.status_availability_name === 'Available' ? '#548e54' : '#83b383'}>
                                            {vehicleDetails.status_availability_name}
                                        </Tag>
                                    </Text>
                                </div>
                            </>
                        )}
                        {isMobile && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Text style={{ color: '#333333' }} className="text-xs">
                                    <span className="font-medium">Category:</span> {vehicleDetails.vehicle_category_name}
                                </Text>
                                <Text style={{ color: '#333333' }} className="text-xs">
                                    <span className="font-medium">Year:</span> {vehicleDetails.year}
                                </Text>
                                <div>
                                    <Text style={{ color: '#333333' }} className="text-xs">
                                        <span className="font-medium">Status:</span>{' '}
                                        <Tag size="small" color={vehicleDetails.status_availability_name === 'Available' ? '#548e54' : '#83b383'}>
                                            {vehicleDetails.status_availability_name}
                                        </Tag>
                                    </Text>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics Section */}
                    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-3 ${isMobile ? 'p-2' : 'p-3'}`}>
                        <div style={{ backgroundColor: '#d4f4dc' }} className={`${isMobile ? 'p-2' : 'p-3'} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                            <Statistic
                                title={<Text style={{ color: '#333333' }} className={isMobile ? 'text-xs' : 'text-xs md:text-sm'}>{isMobile ? 'Usage' : 'Total Usage'}</Text>}
                                value={utilizationData?.totalUtilizations || 0}
                                prefix={<CarOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
                                valueStyle={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: '#548e54' }}
                            />
                        </div>
                        <div style={{ backgroundColor: '#d4f4dc' }} className={`${isMobile ? 'p-2' : 'p-3'} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                            <Statistic
                                title={<Text style={{ color: '#333333' }} className={isMobile ? 'text-xs' : 'text-xs md:text-sm'}>{isMobile ? 'Issues' : 'Total Issues'}</Text>}
                                value={utilizationData?.totalIssues || 0}
                                prefix={<ToolOutlined style={{ color: '#83b383' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
                                valueStyle={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: '#83b383' }}
                            />
                        </div>
                        <div style={{ backgroundColor: '#d4f4dc' }} className={`${isMobile ? 'p-2' : 'p-3'} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                            <Statistic
                                title={<Text style={{ color: '#333333' }} className={isMobile ? 'text-xs' : 'text-xs md:text-sm'}>{isMobile ? 'Avg Time' : 'Average Use Time'}</Text>}
                                value={utilizationData?.avgUtilizationTime || 0}
                                suffix={isMobile ? 'h' : 'hours'}
                                prefix={<ClockCircleOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
                                valueStyle={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: '#548e54' }}
                            />
                        </div>
                        <div style={{ backgroundColor: '#d4f4dc' }} className={`${isMobile ? 'p-2' : 'p-3'} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                            <Statistic
                                title={<Text style={{ color: '#333333' }} className={isMobile ? 'text-xs' : 'text-xs md:text-sm'}>{isMobile ? 'Success' : 'Success Rate'}</Text>}
                                value={utilizationData?.successRate || 0}
                                suffix="%"
                                prefix={<CheckCircleOutlined style={{ color: '#83b383' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
                                valueStyle={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: '#83b383' }}
                            />
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className={isMobile ? 'mt-2' : 'mt-4'}>
                        <Tabs 
                            items={items}
                            className="utilization-tabs"
                            size={isMobile ? 'small' : 'middle'}
                            tabPosition={isMobile ? 'top' : 'top'}
                        />
                    </div>
                </div>
            )}
        </>
    );

    const modalTitle = (
        <Space className="items-center">
            <CarOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-lg' : 'text-xl'} />
            <Title level={isMobile ? 5 : 4} className={`!mb-0 ${isMobile ? '!text-base' : '!text-lg md:!text-xl'}`}>Vehicle Usage</Title>
        </Space>
    );

    if (isMobile) {
        return (
            <Drawer
                title={modalTitle}
                placement="bottom"
                onClose={onCancel}
                open={open}
                height="95%"
                className="vehicle-utilization-drawer"
                headerStyle={{
                    background: 'linear-gradient(135deg, #d4f4dc 0%, #83b383 100%)',
                    borderBottom: '1px solid #83b383'
                }}
                bodyStyle={{
                    padding: '8px',
                    paddingBottom: '20px'
                }}
            >
                {renderContent()}
            </Drawer>
        );
    }

    return (
        <Modal
            title={modalTitle}
            open={open}
            onCancel={onCancel}
            width={isTablet ? "95%" : "90%"}
            style={{ 
                maxWidth: isTablet ? '900px' : '1200px',
                top: 20
            }}
            className="vehicle-utilization-modal"
            footer={null}
            bodyStyle={{ 
                padding: isTablet ? '8px' : '12px',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto'
            }}
            centered
        >
            {renderContent()}
        </Modal>
    );
};

export default View_Utilization;

