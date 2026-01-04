import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useMediaQuery } from 'react-responsive';
import { Button, Input, Pagination, Spin, Table, Tag, Tooltip } from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';
import JobOrderTaskDetailsModal from '../../components/core/JobOrderTaskDetailsModal';

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
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const JobOrderTask = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const baseUrl = SecureStorage.getLocalItem('url');
  const personnelId = SecureStorage.getLocalItem('user_id');

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (isMobile) setPageSize(5);
    else if (isTablet) setPageSize(8);
    else setPageSize(10);
  }, [isMobile, isTablet]);

  const fetchTasks = useCallback(async () => {
    if (!baseUrl || !personnelId) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${baseUrl}personnel.php`,
        { operation: 'fetchJoborderTask', personnel_id: personnelId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setRows(res.data.data);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error('Error fetching job order tasks:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, personnelId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredRows = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const subj = String(r.comp_subject ?? '').toLowerCase();
      const stat = String(r.comp_status ?? '').toLowerCase();
      return subj.includes(q) || stat.includes(q);
    });
  }, [rows, searchTerm]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const columns = useMemo(
    () => [
      {
        title: 'Subject',
        dataIndex: 'comp_subject',
        key: 'comp_subject',
        render: (v) => <span className="text-gray-800">{v || '-'}</span>
      },
      {
        title: 'Status',
        dataIndex: 'comp_status',
        key: 'comp_status',
        render: (v) => <Tag color={getStatusColor(v)}>{v || 'Unknown'}</Tag>
      },
      {
        title: 'Priority',
        dataIndex: 'priority_name',
        key: 'priority_name',
        render: (v) => <span className="text-gray-700">{v || '-'}</span>
      },
      {
        title: 'Created',
        dataIndex: 'job_createDate',
        key: 'job_createDate',
        render: (v) => <span className="text-gray-700">{formatDateTime(v)}</span>
      },
      {
        title: 'Action',
        key: 'action',
        align: 'center',
        render: (_, record) => (
          <div className="flex items-center justify-center">
            <Tooltip title="View Details">
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedTask(record);
                  setDetailsOpen(true);
                }}
              />
            </Tooltip>
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className={`${isMobile ? 'px-4 py-4 mt-13' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <div className={`${isMobile ? 'mb-3' : 'mb-4'}`}>
            <div className="mb-2 sm:mb-4">
              <h2 className="text-2xl font-bold text-green-900 mt-5">Job Order Tasks</h2>
            </div>
          </div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isMobile ? 'Search tasks...' : 'Search by Subject or Status'}
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
                    onClick={fetchTasks}
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
                  rowKey={(r) => String(r.job_id)}
                  columns={columns}
                  dataSource={pagedRows}
                  pagination={false}
                  scroll={{ x: true }}
                />

                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mt-4`}>
                  <span className="text-gray-500">
                    Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} tasks
                  </span>

                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredRows.length}
                    onChange={(p) => setCurrentPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            )}
          </div>

          <JobOrderTaskDetailsModal
            open={detailsOpen}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            baseUrl={baseUrl}
            onSuccess={() => {
              fetchTasks();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default JobOrderTask;
