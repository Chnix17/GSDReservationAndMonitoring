import React, { useState, useEffect, useCallback } from 'react';
import { Card, Statistic, Table, Tag, Select, Button, Tabs, Input, Tooltip, Row, Col } from 'antd';
import { motion } from 'framer-motion';
import {
  CarOutlined,
  HomeOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from '../Sidebar';
import { Line } from '@ant-design/plots';
import {SecureStorage} from '../../utils/encryption';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [maintenanceResources, setMaintenanceResources] = useState([]);
  const [maintenanceResourcesWithStatus, setMaintenanceResourcesWithStatus] = useState([]);
  const [totalCounts, setTotalCounts] = useState({
    venues: 0,
    vehicles: 0,
    equipments: 0,
    venues_in_use: 0,
    vehicles_in_use: 0,
    equipments_in_use: 0
  });
  const [timeRange, setTimeRange] = useState('week');
  const [usageHistory, setUsageHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchAvailabilityStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${baseUrl}/get_totals.php`, {
        operation: 'getAvailabilityStatus'
      });

      if (response.data.status === 'success') {
        setTotalCounts(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching availability statistics');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const fetchUsageStats = useCallback(async () => {
    try {
      const response = await axios.post(`${baseUrl}/get_totals.php`, {
        operation: 'fetchUsageHistory',
        timeRange
      });

      if (response.data.status === 'success') {
        setUsageHistory(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching usage statistics');
    }
  }, [baseUrl, timeRange]);

  const fetchMaintenanceResources = useCallback(async () => {
    try {
      const response = await axios.post(`${baseUrl}/get_totals.php`, {
        operation: 'displayedMaintenanceResources'
      });

      if (response.data.status === 'success') {
        setMaintenanceResources(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching maintenance resources');
    }
  }, [baseUrl]);

  const fetchMaintenanceResourcesWithStatus = useCallback(async () => {
    try {
      const response = await axios.post(`${baseUrl}/user.php`, {
        operation: 'displayedMaintenanceResourcesDone'
      });

      if (response.data.status === 'success') {
        setMaintenanceResourcesWithStatus(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching maintenance resources with status');
    }
  }, [baseUrl]);

  const handleScheduleMaintenance = (record) => {
    // Ensure we have the record_id from the maintenance resources
    const resourceWithRecordId = {
      ...record,
      record_id: record.record_id || record.maintenance_id // fallback to maintenance_id if record_id is not present
    };
    console.log('Resource being passed to modal:', resourceWithRecordId);
  };

  // Enhanced Resource Card Component
  const ResourceCard = ({ title, stats, icon: Icon, color }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="shadow-lg hover:shadow-xl transition-all duration-300 bg-[#fafff4] border-0"
        bodyStyle={{ padding: '1.5rem' }}
      >
        <div className="flex justify-between items-start">
          <div className="w-full">
            <h3 className="text-xl font-bold mb-6 text-green-900 flex items-center">
              {title}
              <Icon className="ml-2 text-2xl" />
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <Statistic 
                title={<span className="text-gray-600">Total</span>} 
                value={stats.total}
                className="statistic-card"
              />
              <Statistic 
                title={<span className="text-gray-600">Available</span>}
                value={stats.available}
                valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                className="statistic-card"
              />
              <Statistic
                title={<span className="text-gray-600">In Use</span>}
                value={stats.inUse}
                valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                className="statistic-card"
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // Usage History Chart
  const UsageChart = ({ data }) => {
    const config = {
      data,
      xField: 'date',
      yField: 'usage',
      seriesField: 'type',
      smooth: true,
      animation: {
        appear: {
          animation: 'wave-in',
          duration: 1500
        }
      }
    };

    return <Line {...config} />;
  };

  // Condition Distribution Chart

  // Update the filter function to handle two statuses
  const filterResourcesByStatus = (resources, status) => {
    if (status === 'unset') {
      return resources.filter(resource => 
        !resource.condition_name || 
        resource.condition_name === '' || 
        resource.condition_name.toLowerCase() === 'damaged' ||
        resource.condition_name.toLowerCase() === 'for maintenance'
      );
    }
    return [];
  };

  const getColumnsForTab = (tabKey) => {
    const baseColumns = [
      {
        title: 'Resource Type',
        dataIndex: 'resource_type',
        key: 'resource_type',
        render: (type) => (
          <Tag color={
            type === 'venue' ? 'blue' :
            type === 'vehicle' ? 'green' :
            'purple'
          }>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Tag>
        )
      },
      {
        title: 'Resource Name',
        dataIndex: 'resource_name',
        key: 'resource_name',
      },
      {
        title: 'Condition',
        dataIndex: 'condition_name',
        key: 'condition_name',
        render: (status) => (
          <Tag color={
            status?.toLowerCase().includes('completed') || status?.toLowerCase().includes('good')
              ? 'green'
              : status?.toLowerCase().includes('pending') || status?.toLowerCase().includes('inspection')
                ? 'orange'
                : status?.toLowerCase() === 'damaged'
                  ? 'red'
                  : 'default'
          }>
            {status || 'Unset'}
          </Tag>
        )
      },
      {
        title: 'Remarks',
        dataIndex: 'remarks',
        key: 'remarks',
      }
    ];

    // Only add action column for unset tab
    if (tabKey === 'unset') {
      return [
        ...baseColumns,
        {
          title: 'Action',
          key: 'action',
          render: (_, record) => (
            <Button
              type="primary"
              size="small"
              onClick={() => handleScheduleMaintenance(record)}
              icon={<ExclamationCircleOutlined />}
            >
              View Details
            </Button>
          )
        }
      ];
    }

    return baseColumns;
  };

  const handleRefresh = () => {
    fetchAvailabilityStats();
    fetchUsageStats();
    fetchMaintenanceResources();
    fetchMaintenanceResourcesWithStatus();
    setSearchTerm('');
  };

  const filteredMaintenanceResources = maintenanceResources.filter(resource =>
    resource.resource_name && resource.resource_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchAvailabilityStats();
    fetchUsageStats();
    fetchMaintenanceResources();
    fetchMaintenanceResourcesWithStatus();
  }, [timeRange, fetchAvailabilityStats, fetchUsageStats, fetchMaintenanceResources, fetchMaintenanceResourcesWithStatus]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <Sidebar />
      <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-8 mt-20">
              <h2 className="text-3xl font-bold text-green-900">
                Resource Reports
              </h2>

            </div>
          </motion.div>

          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} md={8}>
              <ResourceCard
                title="Venues"
                stats={{
                  total: totalCounts.venues || 0,
                  available: totalCounts.venues - totalCounts.venues_in_use,
                  inUse: totalCounts.venues_in_use
                }}
                icon={HomeOutlined}
                color="text-green-900"
              />
            </Col>
            <Col xs={24} md={8}>
              <ResourceCard
                title="Vehicles"
                stats={{
                  total: totalCounts.vehicles || 0,
                  available: totalCounts.vehicles - totalCounts.vehicles_in_use,
                  inUse: totalCounts.vehicles_in_use
                }}
                icon={CarOutlined}
                color="text-green-900"
              />
            </Col>
            <Col xs={24} md={8}>
              <ResourceCard
                title="Equipment"
                stats={{
                  total: totalCounts.equipments || 0,
                  available: totalCounts.equipments - totalCounts.equipments_in_use,
                  inUse: totalCounts.equipments_in_use
                }}
                icon={ToolOutlined}
                color="text-green-900"
              />
            </Col>
          </Row>

          <Card 
            title={
              <div className="flex items-center text-xl font-bold text-green-900">
                <BarChartOutlined className="mr-2" />
                Resource Usage History
              </div>
            }
            className="shadow-lg bg-[#fafff4] border-0 mb-8"
            bodyStyle={{ padding: '1.5rem' }}
          >
            <UsageChart data={usageHistory} />
          </Card>

          <Card 
            className="shadow-lg bg-[#fafff4] border-0 mb-8"
            bodyStyle={{ padding: '1.5rem' }}
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex flex-1 gap-4 w-full">
                <Input
                  placeholder="Search resources by name"
                  allowClear
                  prefix={<SearchOutlined className="text-gray-400" />}
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size="large"
                    className="hover:scale-105 transition-transform"
                  />
                </Tooltip>
              </div>
              <Select
                defaultValue="week"
                onChange={setTimeRange}
                options={[
                  { value: 'week', label: 'Last Week' },
                  { value: 'month', label: 'Last Month' },
                  { value: 'year', label: 'Last Year' }
                ]}
                className="w-full md:w-48"
                size="large"
              />
            </div>
          </Card>

          <Card 
            title={
              <div className="flex items-center text-xl font-bold text-green-900">
                <BarChartOutlined className="mr-2" />
                Defective Resources
              </div>
            }
            className="shadow-lg bg-[#fafff4] border-0"
            bodyStyle={{ padding: '1.5rem' }}
          >
            <Tabs
              defaultActiveKey="unset"
              items={[
                {
                  key: 'unset',
                  label: (
                    <span className="flex items-center">
                      <CloseCircleOutlined className="mr-2 text-red-500" />
                      Unset
                    </span>
                  ),
                  children: (
                    <Table
                      loading={loading}
                      pagination={{ 
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`
                      }}
                      columns={getColumnsForTab('unset')}
                      dataSource={filterResourcesByStatus(filteredMaintenanceResources, 'unset').map(resource => ({
                        key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                        ...resource
                      }))}
                      className="maintenance-table"
                    />
                  ),
                },
                {
                  key: 'done',
                  label: (
                    <span className="flex items-center">
                      <CheckCircleOutlined className="mr-2 text-green-500" />
                      Done
                    </span>
                  ),
                  children: (
                    <Table
                      loading={loading}
                      pagination={{ 
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`
                      }}
                      columns={getColumnsForTab('done')}
                      dataSource={maintenanceResourcesWithStatus.map(resource => ({
                        key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                        ...resource
                      }))}
                      className="maintenance-table"
                    />
                  ),
                }
              ]}
            />
          </Card>
        </div>
      </div>

   
    </div>
  );
};

export default Reports;