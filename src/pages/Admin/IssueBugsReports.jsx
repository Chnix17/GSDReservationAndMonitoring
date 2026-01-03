import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Pagination, Spin, Table, Tooltip, Typography } from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';
import { toast } from 'sonner';

const { Text } = Typography;

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const FieldInput = ({ label, value, icon }) => (
  <div className="w-full">
    <div className="text-[11px] font-semibold text-gray-600 uppercase mb-1">{label}</div>
    <div className="w-full rounded border border-gray-300 bg-white flex items-center overflow-hidden">
      {icon ? (
        <div className="flex items-center justify-center w-9 h-9 text-gray-500 border-r border-gray-200 bg-white">
          {icon}
        </div>
      ) : null}
      <input
        className="flex-1 text-sm text-gray-800 px-3 py-2 focus:outline-none bg-transparent"
        value={value || ''}
        readOnly
      />
    </div>
  </div>
);

const FieldTextarea = ({ label, value }) => (
  <div className="w-full">
    <div className="text-[11px] font-semibold text-gray-600 uppercase mb-1">{label}</div>
    <textarea
      className="w-full rounded border border-gray-300 bg-white text-sm text-gray-800 px-3 py-2 focus:outline-none"
      value={value || ''}
      readOnly
      rows={3}
    />
  </div>
);

const IssueBugsReports = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const baseUrl = SecureStorage.getLocalItem('url');
  const userId = SecureStorage.getLocalItem('user_id');

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isMobile) setPageSize(5);
    else if (isTablet) setPageSize(8);
    else setPageSize(10);
  }, [isMobile, isTablet]);

  const fetchReports = useCallback(async () => {
    if (!baseUrl || !userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}faculty&staff.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'fetchReports',
          userId
        })
      });

      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.data)) {
        setReports(data.data);
      } else {
        setReports([]);
        if (data?.message) toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      if (!navigator.onLine || error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
        toast.error('Network connection lost. Cannot reach the server.');
      } else {
        toast.error('Failed to fetch reports.');
      }
    } finally {
      setLoading(false);
    }
  }, [baseUrl, userId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const id = String(r.report_id ?? '').toLowerCase();
      const name = String(r.name ?? '').toLowerCase();
      const issue = String(r.issue ?? '').toLowerCase();
      const desc = String(r.description ?? '').toLowerCase();
      return id.includes(q) || name.includes(q) || issue.includes(q) || desc.includes(q);
    });
  }, [reports, searchTerm]);

  const pagedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const columns = useMemo(() => [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (v) => <span className="text-gray-800">{v || '-'}</span>
    },
    {
      title: 'Issue',
      dataIndex: 'issue',
      key: 'issue',
      render: (v) => <span className="text-gray-800">{v || '-'}</span>
    },
    {
      title: 'Date Reported',
      dataIndex: 'date_reported',
      key: 'date_reported',
      render: (v) => <span className="text-gray-700">{formatDateTime(v)}</span>
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View">
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedReport(record);
              setIsModalOpen(true);
            }}
          />
        </Tooltip>
      )
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
              <h2 className="text-2xl font-bold text-green-900 mt-5">Issue & Bugs Reports</h2>
            </div>
          </motion.div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isMobile ? 'Search reports...' : 'Search by Report ID, Name, Issue, or Description'}
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
                    onClick={fetchReports}
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
                {pagedReports.length === 0 ? (
                  <div className="py-10">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={<span className="text-gray-500">No reports found</span>}
                    />
                  </div>
                ) : (
                  <Table
                    rowKey={(r) => String(r.report_id)}
                    columns={columns}
                    dataSource={pagedReports}
                    pagination={false}
                    scroll={{ x: true }}
                  />
                )}

                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mt-4`}>
                  <Text type="secondary">
                    Showing {(filteredReports.length === 0) ? 0 : ((currentPage - 1) * pageSize + 1)} to {Math.min(currentPage * pageSize, filteredReports.length)} of {filteredReports.length} reports
                  </Text>

                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredReports.length}
                    onChange={(p) => setCurrentPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            )}
          </div>

          <Modal
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedReport(null);
            }}
            footer={null}
            width={isTablet ? 700 : 800}
            style={isMobile ? { top: 0, paddingBottom: 0 } : undefined}
            bodyStyle={isMobile ? { height: '100vh', overflow: 'auto', padding: 0 } : { padding: 0 }}
            closable={false}
          >
            {!selectedReport ? (
              <div className="flex justify-center items-center h-40">
                <Spin />
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden">
                <div className="bg-[#145414] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <span className="text-white">▣</span>
                    <span className="text-sm">Report Details</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedReport(null);
                    }}
                    className="text-white/90 hover:text-white text-lg leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <FieldInput label="Name" value={selectedReport.name} icon={<span>👤</span>} />
                    <FieldInput label="Issue" value={selectedReport.issue} icon={<span>🔧</span>} />
                    <FieldInput label="Date Reported" value={formatDateTime(selectedReport.date_reported)} icon={<span>🗓</span>} />
                    <FieldTextarea label="Description" value={selectedReport.description} />
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button onClick={() => {
                      setIsModalOpen(false);
                      setSelectedReport(null);
                    }}>Close</Button>
                  </div>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default IssueBugsReports;
