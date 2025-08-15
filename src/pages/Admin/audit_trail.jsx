import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/core/Sidebar';
import axios from 'axios';
import { Table, Input, Button, Empty, Tag, Tooltip, Space, Select } from 'antd';
import { ReloadOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { SecureStorage } from '../../utils/encryption';

const { Search } = Input;
const { Option } = Select;

const AuditTrail = () => {
  const encryptedUrl = SecureStorage.getLocalItem('url');

  // state
  const [loading, setLoading] = useState(false);
  const [audits, setAudits] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${encryptedUrl}/user.php`, {
        operation: 'fetchAudit',
      });
      if (res?.data?.status === 'success' && Array.isArray(res.data.data)) {
        setAudits(res.data.data);
      } else {
        setAudits([]);
      }
    } catch (e) {
      console.error('Failed to fetch audit trail:', e);
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to first page when search or filter changes, or when data refreshes
  useEffect(() => {
    setPagination((p) => ({ ...p, current: 1 }));
  }, [search, actionFilter, audits]);

  // Robust timestamp parser for formats like "YYYY-MM-DD HH:mm:ss"
  const parseTs = (ts) => {
    if (!ts) return 0;
    // Replace space with 'T' for safe parsing
    const iso = typeof ts === 'string' ? ts.replace(' ', 'T') : ts;
    const d = new Date(iso);
    const t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const uniqueActions = useMemo(() => {
    const set = new Set(audits.map((a) => a.action).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [audits]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return audits.filter((a) => {
      const matchesAction = actionFilter === 'All' || a.action === actionFilter;
      if (!q) return matchesAction;
      const hay = `${a?.description ?? ''} ${a?.action ?? ''} ${a?.created_by_name ?? ''}`.toLowerCase();
      return matchesAction && hay.includes(q);
    });
  }, [audits, search, actionFilter]);

  const pagedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    return filteredData.slice(start, start + pagination.pageSize);
  }, [filteredData, pagination]);

  const onChangePage = (page, pageSize) => {
    setPagination({ current: page, pageSize });
  };

  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-gray-800 dark:text-gray-200">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action) => {
        const map = {
          login: 'green',
          logout: 'volcano',
          create: 'blue',
          update: 'gold',
          delete: 'red',
        };
        const color = map[action] || 'cyan';
        return <Tag color={color} className="capitalize">{action}</Tag>;
      },
      filters: uniqueActions
        .filter((a) => a !== 'All')
        .map((a) => ({ text: a, value: a })),
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'User',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      width: 260,
      render: (name) => <span className="font-medium text-gray-900">{name}</span>,
    },
    {
      title: 'Timestamp',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 220,
      sorter: (a, b) => parseTs(a.created_at) - parseTs(b.created_at),
      render: (ts) => {
        const t = parseTs(ts);
        return t ? new Date(t).toLocaleString() : '';
      },
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gray-100 mt-20">
        {/* Header - match Dashboard green gradients */}
        <div className="bg-gradient-to-r from-lime-900 to-green-900 text-white px-4 sm:px-6 py-4 shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Audit Trail</h1>
        
            </div>
            <Space wrap>
              <Select
                value={actionFilter}
                onChange={(v) => {
                  setActionFilter(v);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                suffixIcon={<FilterOutlined />}
                style={{ minWidth: 160 }}
              >
                {uniqueActions.map((a) => (
                  <Option key={a} value={a}>
                    {a}
                  </Option>
                ))}
              </Select>
              <Search
                allowClear
                placeholder="Search description, action, or user"
                onSearch={(v) => setSearch(v)}
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                enterButton={<SearchOutlined />}
                className="min-w-[240px]"
              />
              <Button onClick={fetchAudits} loading={loading} icon={<ReloadOutlined />}>
                Refresh
              </Button>
            </Space>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
            <Table
              rowKey={(r) => r.id}
              loading={loading}
              columns={columns}
              dataSource={pagedData}
              locale={{ emptyText: <Empty description="No audit records" /> }}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredData.length,
                onChange: onChangePage,
                showSizeChanger: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
              }}
              size="middle"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
