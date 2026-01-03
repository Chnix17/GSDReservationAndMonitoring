import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Drawer, Statistic, Spin, Tabs, Typography, Space, Tag } from 'antd';
import { ToolOutlined, ClockCircleOutlined, CheckCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
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

const View_Utilization = ({ open, onCancel, equipment }) => {
    const [loading, setLoading] = useState(true);
    const [utilizationData, setUtilizationData] = useState(null);
    const [equipmentDetails, setEquipmentDetails] = useState(null);
    const [reservationHistory, setReservationHistory] = useState([]); // NEW
    const encryptedUrl = SecureStorage.getLocalItem("url");

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    const COLORS = ['#548e54', '#83b383'];

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
        if (reservations) {
            reservations.forEach(reservation => {
                const month = moment(reservation.reservation_start_date).format('MMM');
                monthlyData[month].utilizations++;
            });
        }

        // Calculate total issues from usage statistics
        const totalIssues = usage_statistics ? (usage_statistics.broken_count + usage_statistics.missing_count) : 0;
        const totalUsage = usage_statistics ? usage_statistics.total_usage : 0;

        // Distribute issues proportionally across months based on utilization
        if (totalUsage > 0) {
            allMonths.forEach(month => {
                const monthUtilizations = monthlyData[month].utilizations;
                monthlyData[month].issues = Math.round((monthUtilizations / totalUsage) * totalIssues);
            });
        }

        const avgUsageTime = calculateAverageUsageTime(reservations);
        const successRate = totalUsage > 0 
            ? ((totalUsage - totalIssues) / totalUsage * 100).toFixed(1)
            : 0;

        setUtilizationData({
            totalUtilizations: totalUsage,
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
            if (open && equipment?.unit_id) {
                setLoading(true);
                try {
                    const response = await axios.post(
                        `${encryptedUrl}/Assigned&Records.php`,
                        {
                            operation: "getEquipmentUnitUsage",
                            unitId: equipment.unit_id
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (response.data.status === 'success') {
                        setEquipmentDetails(response.data.data.equipment_unit_details);
                        processUtilizationData(response.data.data);
                    }
                } catch (error) {
                    console.error('Error fetching utilization data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        // Fetch reservation history
        const fetchReservationHistory = async () => {
            if (open && equipment?.unit_id) {
                try {
                    const response = await axios.post(
                        `${encryptedUrl}/Assigned&Records.php`,
                        {
                            operation: "fetchEquipmentUnitHistory",
                            unit_id: equipment.unit_id
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    if (response.data.status === 'success') {
                        setReservationHistory(response.data.data);
                    } else {
                        setReservationHistory([]);
                    }
                } catch (error) {
                    setReservationHistory([]);
                }
            }
        };

        fetchUtilizationData();
        fetchReservationHistory(); // NEW
    }, [open, equipment, encryptedUrl, processUtilizationData]);

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

    // Render reservation history table
    const renderReservationHistory = () => {
        if (!reservationHistory || reservationHistory.length === 0) {
            return <div className={`${isMobile ? 'p-2' : 'p-4'} text-center text-gray-500`}>No reservation history found.</div>;
        }
        return (
            <div className={`overflow-x-auto ${isMobile ? 'p-1' : 'p-2'}`}>
                <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-green-100">
                        <tr>
                            {!isMobile && (
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Serial Number</th>
                            )}
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Equipment Name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Requester</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Start Date</th>
                            {isDesktop && (
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">End Date</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {reservationHistory.map((item, idx) => (
                            <tr key={idx} className="border-t border-gray-100 hover:bg-green-50">
                                {!isMobile && (
                                    <td className="px-3 py-2 text-sm">{item.serial_number}</td>
                                )}
                                <td className="px-3 py-2 text-sm">{item.equip_name}</td>
                                <td className="px-3 py-2 text-sm">{item.requester}</td>
                                <td className="px-3 py-2 text-sm">{moment(item.reservation_start_date).format(isMobile ? 'MMM D h:mm A' : 'MMMM D h:mm A')}</td>
                                {isDesktop && (
                                    <td className="px-3 py-2 text-sm">{moment(item.reservation_end_date).format('MMMM D h:mm A')}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

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
        // NEW TAB
        {
            key: '2',
            label: <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>{isMobile ? 'History' : 'Reservation History'}</span>,
            children: (
                <div className={`${isMobile ? 'p-2' : 'p-4'}`} style={{ minHeight: isMobile ? '300px' : '500px' }}>
                    {renderReservationHistory()}
                </div>
            ),
        }
    ];

    const renderContent = () => (
        <>
            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Spin size="large" />
                </div>
            ) : equipmentDetails && (
                <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                    {/* Equipment Info Section */}
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-3 ${isMobile ? 'p-2' : 'p-3'}`} style={{ backgroundColor: '#d4f4dc' }}>
                        <div>
                            <Title level={isMobile ? 5 : 4} className={`!mb-2 ${isMobile ? '!text-sm' : '!text-base md:!text-lg'}`}>
                                {equipmentDetails.equip_name}
                            </Title>
                            <Text style={{ color: '#333333' }} className={`block ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
                                <span className="font-medium">Serial Number:</span> {equipmentDetails.serial_number}
                            </Text>
                            {equipmentDetails.equipment_brand && (
                                <Text style={{ color: '#333333' }} className={`block ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
                                    <span className="font-medium">Brand:</span> {equipmentDetails.equipment_brand}
                                </Text>
                            )}
                            {equipmentDetails.equipment_model && (
                                <Text style={{ color: '#333333' }} className={`block ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
                                    <span className="font-medium">Model:</span> {equipmentDetails.equipment_model}
                                </Text>
                            )}
                        </div>
                        {!isMobile && (
                            <>
                                <div>
                                    <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                        <span className="font-medium">Category:</span> {equipmentDetails.equipments_category_name}
                                    </Text>
                                    {equipmentDetails.equipment_description && (
                                        <Text style={{ color: '#333333' }} className="block text-sm md:text-base italic">
                                            <span className="font-medium">Description:</span> {equipmentDetails.equipment_description}
                                        </Text>
                                    )}
                                    {equipmentDetails.equipment_specs && (
                                        <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                            <span className="font-medium">Specs:</span> {equipmentDetails.equipment_specs}
                                        </Text>
                                    )}
                                    {equipmentDetails.inch && (
                                        <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                            <span className="font-medium">Inch:</span> {equipmentDetails.inch}
                                        </Text>
                                    )}
                                </div>
                                <div>
                                    <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                        <span className="font-medium">Status:</span>{' '}
                                        <Tag color={equipmentDetails.status_availability_id === '1' ? '#548e54' : '#83b383'}>
                                            {equipmentDetails.status_availability_name}
                                        </Tag>
                                    </Text>
                                    <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                        <span className="font-medium">Created At:</span> {equipmentDetails.unit_created_at}
                                    </Text>
                                </div>
                            </>
                        )}
                        {isMobile && (
                            <div className="flex flex-col gap-1 mt-2">
                                <Text style={{ color: '#333333' }} className="text-xs">
                                    <span className="font-medium">Category:</span> {equipmentDetails.equipments_category_name}
                                </Text>
                                {equipmentDetails.equipment_description && (
                                    <Text style={{ color: '#333333' }} className="text-xs italic">
                                        <span className="font-medium">Description:</span> {equipmentDetails.equipment_description}
                                    </Text>
                                )}
                                {equipmentDetails.equipment_specs && (
                                    <Text style={{ color: '#333333' }} className="text-xs">
                                        <span className="font-medium">Specs:</span> {equipmentDetails.equipment_specs}
                                    </Text>
                                )}
                                {equipmentDetails.inch && (
                                    <Text style={{ color: '#333333' }} className="text-xs">
                                        <span className="font-medium">Inch:</span> {equipmentDetails.inch}
                                    </Text>
                                )}
                                <Text style={{ color: '#333333' }} className="text-xs">
                                    <span className="font-medium">Created:</span> {equipmentDetails.unit_created_at}
                                </Text>
                                <div>
                                    <Text style={{ color: '#333333' }} className="text-xs">
                                        <span className="font-medium">Status:</span>{' '}
                                        <Tag size="small" color={equipmentDetails.status_availability_id === '1' ? '#548e54' : '#83b383'}>
                                            {equipmentDetails.status_availability_name}
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
                                prefix={<DatabaseOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
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
                        />
                    </div>
                </div>
            )}
        </>
    );

    const modalTitle = (
        <Space className="items-center">
            <ToolOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-lg' : 'text-xl'} />
            <Title level={isMobile ? 5 : 4} className={`!mb-0 ${isMobile ? '!text-base' : '!text-lg md:!text-xl'}`}>Equipment Unit Usage</Title>
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
                className="equipment-utilization-drawer"
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
            className="equipment-utilization-modal"
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

