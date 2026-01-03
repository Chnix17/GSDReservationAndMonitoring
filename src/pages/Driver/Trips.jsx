import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useMediaQuery } from 'react-responsive';
import { Table, Input, Button, Tooltip, Empty, Pagination, Spin, Card } from 'antd';
import { SearchOutlined, ReloadOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';

// Safe date parser and formatter
const parseDateSafe = (dateString) => {
  if (!dateString) return null;
  const d = new Date(String(dateString).replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
};

const formatSafe = (dateString, fmt = 'MMM dd, yyyy h:mm a') => {
  const d = parseDateSafe(dateString);
  try {
    return d ? format(d, fmt) : '-';
  } catch {
    return '-';
  }
};


const Trips = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isSmallScreen = useMediaQuery({ maxWidth: 1023 });

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('active');

  const baseUrl = SecureStorage.getLocalItem('url');
  const driverId = SecureStorage.getLocalItem('user_id');

  const fetchTrips = async (type = 'active') => {
    setLoading(true);
    try {
      const operation = type === 'active' ? 'fetchActiveTrips' : 'fetchInactiveTrips';
      const { data } = await axios.post(`${baseUrl}driver.php`, {
        operation,
        driver_id: driverId,
      });
      if (data.status === 'success' && data.data) {
        setTrips(data.data);
      } else {
        setTrips([]);
      }
    } catch (err) {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // Update page size based on screen size
  useEffect(() => {
    if (isMobile) {
      setPageSize(5);
    } else if (isTablet) {
      setPageSize(8);
    } else {
      setPageSize(10);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    fetchTrips(activeTab);
    // eslint-disable-next-line
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        trip.reservation_title?.toLowerCase().includes(term) ||
        trip.reservation_description?.toLowerCase().includes(term) ||
        trip.vehicle_model_name?.toLowerCase().includes(term) ||
        trip.vehicle_make_name?.toLowerCase().includes(term) ||
        trip.vehicle_category_name?.toLowerCase().includes(term)
      );
    });
  }, [trips, searchTerm]);

  const columns = [
    {
      title: 'Title',
      dataIndex: 'reservation_title',
      key: 'reservation_title',
      render: (text) => <span className="font-bold">{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'reservation_description',
      key: 'reservation_description',
      render: (text) => <span className="truncate block max-w-[140px]">{text}</span>,
    },
    {
      title: 'Start Date',
      dataIndex: 'reservation_start_date',
      key: 'reservation_start_date',
      render: (_, record) => {
        const effective = record.reschedule_start_date || record.reservation_start_date;
        return formatSafe(effective);
      },
    },
    {
      title: 'End Date',
      dataIndex: 'reservation_end_date',
      key: 'reservation_end_date',
      render: (_, record) => {
        const effective = record.reschedule_end_date || record.reservation_end_date;
        return formatSafe(effective);
      },
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      render: (_, record) => (
        <div>
          <div><b>Model:</b> {record.vehicle_model_name}</div>
          <div><b>Make:</b> {record.vehicle_make_name}</div>
          <div><b>Category:</b> {record.vehicle_category_name}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-none">
        <Sidebar />
      </div>
      <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-20">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Trips</h2>
          
          {/* Tabs Navigation */}
          <div className={`bg-white rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-6'}`}>
            <div className={`${isMobile ? 'flex flex-col' : 'flex flex-row'} w-full`}>
              <div className={`${isMobile ? 'flex flex-col' : 'flex flex-row'} w-full`}>
                {[
                  {
                    key: 'active',
                    label: 'Active Trips',
                    shortLabel: 'Active',
                    icon: <CarOutlined />,
                    count: trips.filter(t => activeTab === 'active').length,
                    color: 'blue'
                  },
                  {
                    key: 'inactive',
                    label: 'Completed Trips',
                    shortLabel: 'Completed',
                    icon: <CheckCircleOutlined />,
                    count: trips.filter(t => activeTab === 'inactive').length,
                    color: 'green'
                  }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 transition-colors duration-200 ${
                      isMobile 
                        ? 'px-3 py-2 border-l-4' 
                        : 'px-4 py-3 border-b-2'
                    } ${
                      activeTab === tab.key
                        ? isMobile 
                          ? 'border-green-600 text-green-600 bg-green-50'
                          : 'border-green-600 text-green-600'
                        : isMobile
                          ? 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                    }`}
                  >
                    <span className={`${isMobile ? 'text-sm' : 'text-base'} ${
                      activeTab === tab.key ? 'text-green-600' : `text-${tab.color}-500`
                    }`}>
                      {tab.icon}
                    </span>
                    <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {isMobile && isSmallScreen ? tab.shortLabel : tab.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      isMobile ? 'text-xs' : 'text-xs'
                    } ${
                      activeTab === tab.key
                        ? 'bg-green-100 text-green-600'
                        : `bg-${tab.color}-50 text-${tab.color}-600`
                    }`}>
                      {activeTab === tab.key ? filteredTrips.length : 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Search & Controls */}
          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? "Search..." : "Search trips by title, vehicle..."}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? "middle" : "large"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchTrips(activeTab)}
                  size={isMobile ? "middle" : "large"}
                  className={isMobile ? 'w-full' : ''}
                >
                  {isMobile && 'Refresh'}
                </Button>
              </Tooltip>
            </div>
          </div>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <>
                {isMobile ? (
                  // Mobile Card View
                  <div className="space-y-3 p-3">
                    {filteredTrips && filteredTrips.length > 0 ? (
                      filteredTrips
                        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                        .map((trip) => (
                          <Card
                            key={trip.reservation_id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm"
                            size="small"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-sm text-gray-900 mb-1">
                                    {trip.reservation_title}
                                  </h3>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {trip.reservation_description}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="border-t border-gray-100 pt-2 space-y-1">
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Start: </span>
                                  <span className="text-gray-600">{formatSafe(trip.reservation_start_date)}</span>
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">End: </span>
                                  <span className="text-gray-600">{formatSafe(trip.reservation_end_date)}</span>
                                </div>
                              </div>
                              
                              <div className="border-t border-gray-100 pt-2 space-y-1">
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Model: </span>
                                  <span className="text-gray-600">{trip.vehicle_model_name}</span>
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Make: </span>
                                  <span className="text-gray-600">{trip.vehicle_make_name}</span>
                                </div>
                                <div className="text-xs">
                                  <span className="font-medium text-gray-700">Category: </span>
                                  <span className="text-gray-600">{trip.vehicle_category_name}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <span className="text-gray-500">
                              {activeTab === 'active' ? 'No active trips found' : 'No completed trips found'}
                            </span>
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Desktop/Tablet Table View
                  <>
                    <Table
                      columns={columns}
                      dataSource={filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                      rowKey="reservation_id"
                      pagination={false}
                      locale={{ emptyText: <Empty description={<span className="text-gray-500 dark:text-gray-400">{activeTab === 'active' ? 'No active trips found' : 'No completed trips found'}</span>} /> }}
                    />
                  </>
                )}
                <div className={`p-4 border-t border-gray-200 dark:border-gray-700 ${
                  isMobile ? 'flex justify-center' : 'flex justify-end'
                }`}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredTrips.length}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={!isMobile}
                    showTotal={!isMobile ? (total, range) => `${range[0]}-${range[1]} of ${total} items` : undefined}
                    simple={isMobile}
                    size={isMobile ? 'small' : 'default'}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trips;
