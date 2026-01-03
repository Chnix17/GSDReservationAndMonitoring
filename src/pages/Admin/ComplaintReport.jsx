import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, Pagination, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { EyeOutlined, FileExcelOutlined, FilePdfOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import { motion } from 'framer-motion';
import JobOrderDetailsModal from '../../components/core/JobOrderDetailsModal';
import { generateComplaintReportPdf } from './core/complaint_report_pdf';
import { generateComplaintReportExcel } from './core/complaint_report_excel';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('complete') || s.includes('done') || s.includes('closed')) return 'green';
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

const ComplaintReport = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const baseUrl = SecureStorage.getLocalItem('url');

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState(null);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isMobile) setLimit(5);
    else if (isTablet) setLimit(8);
    else setLimit(10);
  }, [isMobile, isTablet]);

  const fetchList = useCallback(async ({ nextOffset } = {}) => {
    if (!baseUrl) return;

    const effectiveOffset = typeof nextOffset === 'number' ? nextOffset : offset;

    setLoading(true);
    try {
      const payload = {
        operation: 'getComplaintReportList',
        limit,
        offset: effectiveOffset
      };

      if (dateRange?.length === 2 && dateRange[0] && dateRange[1]) {
        payload.start_date = dateRange[0].format('YYYY-MM-DD');
        payload.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await axios.post(
        `${baseUrl}/JobOrder.php`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setRows(res.data.data);
        setTotal(Number(res.data.total || 0));
        setOffset(effectiveOffset);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('Error fetching complaint report list:', e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, limit, offset, dateRange]);

  useEffect(() => {
    fetchList({ nextOffset: 0 });
  }, [fetchList, limit]);

  useEffect(() => {
    setOffset(0);
    fetchList({ nextOffset: 0 });
  }, [dateRange, fetchList]);

  const filteredRows = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const subject = String(r.comp_subject ?? '').toLowerCase();
      const client = String(r.client_name ?? '').toLowerCase();
      const location = String(r.location_name ?? '').toLowerCase();
      const equipment = String(r.equipments_used ?? '').toLowerCase();
      const personnel = String(r.personnel_ids ?? '').toLowerCase();
      const status = String(r.latest_status ?? '').toLowerCase();
      return (
        subject.includes(q) ||
        client.includes(q) ||
        location.includes(q) ||
        equipment.includes(q) ||
        personnel.includes(q) ||
        status.includes(q)
      );
    });
  }, [rows, searchTerm]);

  const handleViewDetails = useCallback((record) => {
    setSelectedRecord({
      comp_id: record.comp_id,
      comp_subject: record.comp_subject,
      comp_status: record.latest_status,
      operation_name: record.operation_name,
      location_name: record.location_name,
      client_full_name: record.client_name,
      last_user_full_name: record.submitted_by,
      comp_date: record.comp_date,
      assigned_personnel: record.personnel_ids,
      equipments_used: record.equipments_used
    });
    setIsModalOpen(true);
  }, []);

  const fetchComplaintReportData = useCallback(async (complaintId) => {
    const res = await axios.post(
      `${baseUrl}/JobOrder.php`,
      { operation: 'getComplaintReportData', complaint_id: complaintId },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.data?.status === 'success') return res.data.data;
    throw new Error(res.data?.message || 'Failed to fetch complaint report data');
  }, [baseUrl]);

  const fetchComplaintStatusHistory = useCallback(async (complaintId) => {
    const res = await axios.post(
      `${baseUrl}/JobOrder.php`,
      { operation: 'getComplaintStatusHistory', complaint_id: complaintId },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.data?.status === 'success' && Array.isArray(res.data.data)) return res.data.data;
    throw new Error(res.data?.message || 'Failed to fetch complaint status history');
  }, [baseUrl]);

  const exportCurrentPage = useCallback(async (type) => {
    if (!baseUrl) return;
    if (!Array.isArray(filteredRows) || filteredRows.length === 0) return;

    setExporting(true);
    try {
      const selectedId = Number(selectedRecord?.comp_id);
      const fallbackId = Number(filteredRows[0]?.comp_id);
      const complaintId = selectedId || fallbackId;
      if (!complaintId) throw new Error('Missing complaint_id');

      const [complaint, history] = await Promise.all([
        fetchComplaintReportData(complaintId),
        fetchComplaintStatusHistory(complaintId)
      ]);

      if (type === 'pdf') {
        generateComplaintReportPdf({ complaint, history });
      } else {
        generateComplaintReportExcel({ complaint, history });
      }
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  }, [baseUrl, filteredRows, fetchComplaintReportData, fetchComplaintStatusHistory, selectedRecord]);

  const columns = useMemo(() => [
    {
      title: 'Subject',
      dataIndex: 'comp_subject',
      key: 'comp_subject',
      render: (v) => <span className="text-gray-800">{v}</span>
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (v) => <span className="text-gray-700">{v || '-'}</span>
    },
    {
      title: 'Location',
      dataIndex: 'location_name',
      key: 'location_name',
      render: (v) => <span className="text-gray-700">{v || '-'}</span>
    },
    {
      title: 'Equipment',
      dataIndex: 'equipments_used',
      key: 'equipments_used',
      render: (v) => {
        const display = (v && String(v).trim()) ? String(v) : '-';
        return (
          <span className="text-gray-700">{display}</span>
        );
      }
    },
    {
      title: 'Assigned Personnel',
      dataIndex: 'personnel_ids',
      key: 'personnel_ids',
      render: (v) => <span className="text-gray-700">{v || '-'}</span>
    },
    {
      title: 'Date',
      dataIndex: 'comp_date',
      key: 'comp_date',
      render: (v) => <span className="text-gray-700">{formatDateTime(v)}</span>
    },
    {
      title: 'Status',
      dataIndex: 'latest_status',
      key: 'latest_status',
      render: (v) => <Tag color={getStatusColor(v)}>{v || 'Unknown'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      )
    }
  ], [handleViewDetails]);

  const currentPage = Math.floor(offset / limit) + 1;

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
              <h2 className="text-2xl font-bold text-green-900 mt-5">Complaint Report</h2>
              <p className="text-sm text-gray-600 mt-1">View and manage complaint reports</p>
            </div>
          </motion.div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isMobile ? 'Search complaints...' : 'Search by subject or client name...'}
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
                    onClick={() => fetchList({ nextOffset: 0 })}
                    size={isMobile ? 'middle' : 'large'}
                    className={isMobile ? 'w-full' : ''}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center justify-between gap-3'} w-full`}>
              <div className={`${isMobile ? 'w-full' : ''}`}>
                <Text type="secondary" className="block mb-1">Filter by Date Range</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(v) => setDateRange(v)}
                  size={isMobile ? 'middle' : 'large'}
                  className={isMobile ? 'w-full' : ''}
                />
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-2'}`}>
                <Button
                  type="primary"
                  onClick={() => fetchList({ nextOffset: 0 })}
                  className="bg-blue-600 hover:bg-blue-700"
                  size={isMobile ? 'middle' : 'large'}
                >
                  Filter
                </Button>

                <Button
                  onClick={() => {
                    setDateRange(null);
                  }}
                  size={isMobile ? 'middle' : 'large'}
                >
                  Clear
                </Button>

                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() => exportCurrentPage('excel')}
                  loading={exporting}
                  disabled={exporting || filteredRows.length === 0}
                  size={isMobile ? 'middle' : 'large'}
                >
                  Excel
                </Button>

                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() => exportCurrentPage('pdf')}
                  loading={exporting}
                  disabled={exporting || filteredRows.length === 0}
                  size={isMobile ? 'middle' : 'large'}
                >
                  PDF
                </Button>
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
                  dataSource={filteredRows}
                  pagination={false}
                  scroll={{ x: true }}
                />

                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mt-4`}>
                  <Text type="secondary">
                    Total: {total} complaints
                  </Text>

                  <Pagination
                    current={currentPage}
                    pageSize={limit}
                    total={total}
                    onChange={(p) => {
                      const nextOffset = (p - 1) * limit;
                      fetchList({ nextOffset });
                    }}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            )}
          </div>

          <JobOrderDetailsModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            ticket={selectedRecord}
            baseUrl={baseUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default ComplaintReport;
