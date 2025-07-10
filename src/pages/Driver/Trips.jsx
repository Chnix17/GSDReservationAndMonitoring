import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Input, Button, Tooltip, Empty, Pagination, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { format, differenceInSeconds } from 'date-fns';
import Sidebar from './component/sidebar';
import { SecureStorage } from '../../utils/encryption';

const Countdown = ({ startDate }) => {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, differenceInSeconds(new Date(startDate), new Date()));
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  if (secondsLeft <= 0) return <span>Started</span>;
  const days = Math.floor(secondsLeft / (3600 * 24));
  const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  return (
    <span>
      {days > 0 && `${days}d `}
      {hours > 0 && `${hours}h `}
      {minutes > 0 && `${minutes}m `}
      {seconds}s
    </span>
  );
};

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const baseUrl = SecureStorage.getLocalItem('url');
  const driverId = SecureStorage.getSessionItem('user_id');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${baseUrl}driver.php`, {
        operation: 'fetchActiveTrips',
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

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line
  }, []);

  const filteredTrips = trips.filter((trip) => {
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'reservation_id',
      key: 'reservation_id',
      width: 60,
    },
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
      render: (date) => format(new Date(date), 'MMM dd, yyyy h:mm a'),
    },
    {
      title: 'End Date',
      dataIndex: 'reservation_end_date',
      key: 'reservation_end_date',
      render: (date) => format(new Date(date), 'MMM dd, yyyy h:mm a'),
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
    {
      title: 'Countdown',
      key: 'countdown',
      render: (_, record) => <Countdown startDate={record.reservation_start_date} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-none">
        <Sidebar />
      </div>
      <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-20">
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-row items-center gap-2 w-full">
              <div className="flex-grow">
                <Input
                  placeholder="Search trips..."
                  allowClear
                  prefix={<SearchOutlined />}
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchTrips}
                  size="large"
                  style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
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
                <Table
                  columns={columns}
                  dataSource={filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                  rowKey="reservation_id"
                  pagination={false}
                  locale={{ emptyText: <Empty description={<span className="text-gray-500 dark:text-gray-400">No trips found</span>} /> }}
                />
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredTrips.length}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger={true}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                    className="flex justify-end"
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
