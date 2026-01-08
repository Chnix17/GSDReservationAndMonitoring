import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Pagination, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import { motion } from 'framer-motion';
import JobOrderDetailsModal from '../../components/core/JobOrderDetailsModal';
import AssignJobOrderModal from '../../components/core/AssignJobOrderModal';

const { Text } = Typography;

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('complete') || s.includes('done')) return 'green';
  if (s.includes('pending')) return 'gold';
  if (s.includes('ongoing') || s.includes('on-going') || s.includes('in progress')) return 'blue';
  if (s.includes('decline') || s.includes('cancel') || s.includes('reject')) return 'red';
  return 'default';
};

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const AllJobOrders = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const baseUrl = SecureStorage.getLocalItem('url');

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssignTicket, setSelectedAssignTicket] = useState(null);

  useEffect(() => {
    if (isMobile) setPageSize(5);
    else if (isTablet) setPageSize(8);
    else setPageSize(10);
  }, [isMobile, isTablet]);

  const fetchTickets = useCallback(async () => {
    if (!baseUrl) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}/Admin.php`,
        { operation: 'getAllTickets' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        setTickets(response.data.data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
      const id = String(t.comp_id ?? '').toLowerCase();
      const subj = String(t.comp_subject ?? '').toLowerCase();
      const stat = String(t.comp_status ?? '').toLowerCase();
      return id.includes(q) || subj.includes(q) || stat.includes(q);
    });
  }, [tickets, searchTerm]);

  const pagedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const columns = useMemo(() => [
    {
      title: 'Ticket ID',
      dataIndex: 'comp_id',
      key: 'comp_id',
      render: (v) => <Text className="text-gray-800">#{v}</Text>
    },
    {
      title: 'Subject',
      dataIndex: 'comp_subject',
      key: 'comp_subject',
      render: (v) => <span className="text-gray-800">{v}</span>
    },
    {
      title: 'Status',
      dataIndex: 'comp_status',
      key: 'comp_status',
      render: (v) => <Tag color={getStatusColor(v)}>{v || 'Unknown'}</Tag>
    },
    {
      title: 'Operation',
      dataIndex: 'operation_name',
      key: 'operation_name',
      render: (v) => <span className="text-gray-700">{v || '-'}</span>
    },
    {
      title: 'Closed By',
      dataIndex: 'closed_by_full_name',
      key: 'closed_by_full_name',
      render: (v) => <span className="text-gray-700">{v || '-'}</span>
    },
    {
      title: 'Last User',
      dataIndex: 'last_user_full_name',
      key: 'last_user_full_name',
      render: (v) => <span className="text-gray-700">{v || '-'}</span>
    },
    {
      title: 'Date Created',
      dataIndex: 'comp_date',
      key: 'comp_date',
      render: (v) => <span className="text-gray-700">{formatDateTime(v)}</span>
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => {
        const isPending = String(record?.comp_status || '').toLowerCase().includes('pending');

        return (
          <div className="flex items-center justify-center gap-2">
            {isPending ? (
              <Tooltip title="Assign & Create Job Order">
                <Button
                  type="primary"
                  className="bg-green-600 hover:!bg-green-700 border-green-600 hover:!border-green-700"
                  onClick={() => {
                    setSelectedAssignTicket(record);
                    setIsAssignModalOpen(true);
                  }}
                >
                  Assign
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="View">
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedTicket(record);
                    setIsModalOpen(true);
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className={`${isMobile ? 'px-4 py-4 mt-13' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Job Orders
              </h2>
            </div>
          </motion.div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isMobile ? 'Search job orders...' : 'Search by Ticket ID, Subject, or Status'}
                  prefix={<SearchOutlined />}
                  allowClear
                  size={isMobile ? 'middle' : 'large'}
                  className="w-full"
                />
              </div>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchTickets}
                    size={isMobile ? 'middle' : 'large'}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isMobile && 'Refresh'}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin />
              </div>
            ) : (
              <div className={isMobile ? 'p-3' : 'p-4'}>
                <Table
                  rowKey={(r) => String(r.comp_id)}
                  columns={columns}
                  dataSource={pagedTickets}
                  pagination={false}
                  scroll={{ x: true }}
                />

                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mt-4`}>
                  <Text type="secondary">
                    Showing {(filteredTickets.length === 0) ? 0 : ((currentPage - 1) * pageSize + 1)} to {Math.min(currentPage * pageSize, filteredTickets.length)} of {filteredTickets.length} tickets
                  </Text>

                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredTickets.length}
                    onChange={(p) => setCurrentPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            )}
          </div>

          <JobOrderDetailsModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            ticket={selectedTicket}
            baseUrl={baseUrl}
          />

          <AssignJobOrderModal
            open={isAssignModalOpen}
            onClose={() => {
              setIsAssignModalOpen(false);
              setSelectedAssignTicket(null);
            }}
            ticket={selectedAssignTicket}
            baseUrl={baseUrl}
            onSuccess={() => {
              fetchTickets();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AllJobOrders;
