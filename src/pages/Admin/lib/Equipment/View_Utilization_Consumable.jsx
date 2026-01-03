import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Drawer, Statistic, Spin, Tabs, Typography, Space, Tag, Table } from 'antd';
import { ToolOutlined, CheckCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
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

const View_Utilization_Consumable = ({ open, onCancel, equipment }) => {
    const [loading, setLoading] = useState(true);
    const [utilizationData, setUtilizationData] = useState(null);
    const [equipmentDetails, setEquipmentDetails] = useState(null);
    const [reservationHistory, setReservationHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const encryptedUrl = SecureStorage.getLocalItem("url");

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    const COLORS = ['#548e54', '#83b383'];

 

    const fetchReservationHistory = useCallback(async () => {
        if (!equipment?.equip_id) return;
        setHistoryLoading(true);
        try {
            const response = await axios.post(
                `${encryptedUrl}/Assigned&Records.php`,
                {
                    operation: "fetchEquipmentHistory",
                    equip_id: equipment.equip_id
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
    }, [equipment?.equip_id, encryptedUrl]);

    useEffect(() => {
        const fetchUtilizationData = async () => {
            if (open && equipment?.equip_id) {
                setLoading(true);
                try {
                    const response = await axios.post(
                        `${encryptedUrl}/Assigned&Records.php`,
                        {
                            operation: "getConsumableUsage",
                            equipId: equipment.equip_id
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (response.data.status === 'success') {
                        setEquipmentDetails(response.data.data.equipment_details);
                        processUtilizationData(response.data.data);
                    }
                } catch (error) {
                    console.error('Error fetching utilization data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUtilizationData();
        if (open && equipment?.equip_id) {
            fetchReservationHistory();
        }
    }, [open, equipment, encryptedUrl, fetchReservationHistory]);

    const processUtilizationData = (data) => {
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

        // Process reservations
        if (reservations) {
            reservations.forEach(reservation => {
                const month = moment(reservation.reservation_start_date).format('MMM');
                monthlyData[month].utilizations += parseInt(reservation.reservation_equipment_quantity) || 0;
                monthlyData[month].issues += parseInt(reservation.qty_bad) || 0;
            });
        }

        const totalUsage = usage_statistics ? parseInt(usage_statistics.total_usage_quantity) || 0 : 0;
        const totalIssues = usage_statistics ? parseInt(usage_statistics.total_qty_bad) || 0 : 0;
        const successRate = totalUsage > 0 
            ? ((totalUsage - totalIssues) / totalUsage * 100).toFixed(1)
            : 0;

        setUtilizationData({
            totalUtilizations: totalUsage,
            totalIssues: totalIssues,
            totalGoodQuantity: usage_statistics ? parseInt(usage_statistics.total_good_quantity) || 0 : 0,
            successRate: successRate,
            monthlyUtilization: allMonths.map(month => ({
                month,
                utilizations: monthlyData[month].utilizations,
                issues: monthlyData[month].issues
            }))
        });
    };

    const renderMonthlyUtilizationChart = () => {
        if (!utilizationData?.monthlyUtilization) return null;

        const chartData = {
            labels: utilizationData.monthlyUtilization.map(item => item.month),
            datasets: [
                {
                    label: 'Items Used',
                    data: utilizationData.monthlyUtilization.map(item => item.utilizations),
                    backgroundColor: COLORS[0],
                    borderRadius: 4,
                    maxBarThickness: 35,
                },
                {
                    label: 'Damaged/Lost Items',
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
                    beginAtZero: true
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
    const getHistoryColumns = () => {
        const baseColumns = [
            {
                title: 'Requester',
                dataIndex: 'requester',
                key: 'requester',
                width: isMobile ? 100 : 120,
            },
            {
                title: 'Quantity',
                dataIndex: 'reservation_equipment_quantity',
                key: 'reservation_equipment_quantity',
                width: isMobile ? 80 : 100,
            },
            {
                title: 'Start Date',
                dataIndex: 'reservation_start_date',
                key: 'reservation_start_date',
                render: (text) => text ? moment(text).format(isMobile ? 'MMM D h:mm A' : 'MMMM D h:mm A') : '',
                width: isMobile ? 120 : 160,
            },
        ];

        // Add End Date column for desktop only
        if (isDesktop) {
            baseColumns.push({
                title: 'End Date',
                dataIndex: 'reservation_end_date',
                key: 'reservation_end_date',
                render: (text) => text ? moment(text).format('MMMM D h:mm A') : '',
                width: 160,
            });
        }

        return baseColumns;
    };

    const renderReservationHistoryTable = () => (
        <div className={`${isMobile ? 'p-2' : 'p-4'}`} style={{ minHeight: isMobile ? '300px' : '500px' }}>
            <Table
                dataSource={reservationHistory}
                loading={historyLoading}
                rowKey={(record, idx) => idx}
                pagination={{ 
                    pageSize: isMobile ? 5 : isTablet ? 6 : 8,
                    simple: isMobile,
                    size: isMobile ? 'small' : 'default'
                }}
                columns={getHistoryColumns()}
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
            children: renderReservationHistoryTable(),
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
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 ${isMobile ? 'p-2' : 'p-3'}`} style={{ backgroundColor: '#d4f4dc' }}>
                        <div>
                            <Title level={isMobile ? 5 : 4} className={`!mb-2 ${isMobile ? '!text-sm' : '!text-base md:!text-lg'}`}>
                                {equipmentDetails.equip_name}
                            </Title>
                            <Text style={{ color: '#333333' }} className={`block ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
                                <span className="font-medium">Type:</span> {equipmentDetails.equip_type}
                            </Text>
                        </div>
                        {!isMobile && (
                            <div>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Created At:</span> {equipmentDetails.equip_created_at}
                                </Text>
                                <Text style={{ color: '#333333' }} className="block text-sm md:text-base">
                                    <span className="font-medium">Status:</span>{' '}
                                    <Tag color={equipmentDetails.is_active === '1' ? '#548e54' : '#83b383'}>
                                        {equipmentDetails.is_active === '1' ? 'Active' : 'Inactive'}
                                    </Tag>
                                </Text>
                            </div>
                        )}
                        {isMobile && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Text style={{ color: '#333333' }} className="text-xs">
                                    <span className="font-medium">Created:</span> {equipmentDetails.equip_created_at}
                                </Text>
                                <div>
                                    <Text style={{ color: '#333333' }} className="text-xs">
                                        <span className="font-medium">Status:</span>{' '}
                                        <Tag size="small" color={equipmentDetails.is_active === '1' ? '#548e54' : '#83b383'}>
                                            {equipmentDetails.is_active === '1' ? 'Active' : 'Inactive'}
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
                                title={<Text style={{ color: '#333333' }} className={isMobile ? 'text-xs' : 'text-xs md:text-sm'}>{isMobile ? 'Items Used' : 'Total Items Used'}</Text>}
                                value={utilizationData?.totalUtilizations || 0}
                                prefix={<DatabaseOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
                                valueStyle={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: '#548e54' }}
                            />
                        </div>
                        <div style={{ backgroundColor: '#d4f4dc' }} className={`${isMobile ? 'p-2' : 'p-3'} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                            <Statistic
                                title={<Text style={{ color: '#333333' }} className={isMobile ? 'text-xs' : 'text-xs md:text-sm'}>{isMobile ? 'Damaged' : 'Damaged/Lost Items'}</Text>}
                                value={utilizationData?.totalIssues || 0}
                                prefix={<ToolOutlined style={{ color: '#83b383' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
                                valueStyle={{ fontSize: isMobile ? '14px' : '18px', fontWeight: '600', color: '#83b383' }}
                            />
                        </div>
                        <div style={{ backgroundColor: '#d4f4dc' }} className={`${isMobile ? 'p-2' : 'p-3'} rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
                            <Statistic
                                title={<Text style={{ color: '#333333' }} className={isMobile ? 'text-xs' : 'text-xs md:text-sm'}>{isMobile ? 'Good Items' : 'Good Condition Items'}</Text>}
                                value={utilizationData?.totalGoodQuantity || 0}
                                prefix={<CheckCircleOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-sm' : 'text-base md:text-lg'} />}
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

                    {/* Chart & Tabs Section */}
                    <div className={isMobile ? 'mt-2' : 'mt-4'}>
                        <Tabs 
                            items={items}
                            className="utilization-tabs"
                            size={isMobile ? 'small' : 'middle'}
                            activeKey={activeTab}
                            onChange={setActiveTab}
                        />
                    </div>
                </div>
            )}
        </>
    );

    const modalTitle = (
        <Space className="items-center">
            <ToolOutlined style={{ color: '#548e54' }} className={isMobile ? 'text-lg' : 'text-xl'} />
            <Title level={isMobile ? 5 : 4} className={`!mb-0 ${isMobile ? '!text-base' : '!text-lg md:!text-xl'}`}>Consumable Usage Statistics</Title>
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

export default View_Utilization_Consumable;

