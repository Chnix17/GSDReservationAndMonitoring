import React, { useState, useEffect, useCallback } from 'react';
import { Card, Statistic, Table, Tag, Button, Tabs, Input, Tooltip, Row, Col, Dropdown, Modal } from 'antd';
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
  BarChartOutlined,
  FilterOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from '../Sidebar';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

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
    const resourceWithRecordId = {
      ...record,
      record_id: record.record_id || record.maintenance_id
    };
    setSelectedResource(resourceWithRecordId);
    setIsModalOpen(true);
  };

  const handleUpdateResourceStatus = async (isFixed) => {
    if (!selectedResource) return;
    try {
      await axios.post(`${baseUrl}/get_totals.php`, {
        operation: "updateResourceStatusAndCondition",
        type: selectedResource.resource_type,
        resourceId: selectedResource.resource_id, // or the correct field for your resource
        recordId: selectedResource.record_id || selectedResource.maintenance_id,
        isFixed: isFixed
      });
      toast.success(isFixed ? "Resource marked as fixed." : "Resource marked as cannot be fixed.");
      setIsModalOpen(false);
      fetchMaintenanceResources();
      fetchMaintenanceResourcesWithStatus();
    } catch (error) {
      toast.error("Failed to update resource status.");
    }
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

  // Update the filter function to handle two statuses
  const filterResourcesByStatus = (resources, status) => {
    if (status === 'unset') {
      // Show all resources that are not 'good' or 'completed' (case-insensitive), or missing/empty
      return resources.filter(resource => {
        const cond = resource.condition_name ? resource.condition_name.toLowerCase() : '';
        return !cond || (cond !== 'good' && cond !== 'completed');
      });
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
    fetchMaintenanceResources();
    fetchMaintenanceResourcesWithStatus();
    setSearchTerm('');
  };

  const filteredMaintenanceResources = maintenanceResources.filter(resource =>
    resource.resource_name && resource.resource_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchAvailabilityStats();
    fetchMaintenanceResources();
    fetchMaintenanceResourcesWithStatus();
  }, [timeRange, fetchAvailabilityStats, fetchMaintenanceResources, fetchMaintenanceResourcesWithStatus]);

  // Add debugging logs to help verify filtering
  useEffect(() => {
    console.log("maintenanceResources:", maintenanceResources);
    console.log("filteredMaintenanceResources:", filteredMaintenanceResources);
    console.log("Defective resources:", filterResourcesByStatus(filteredMaintenanceResources, 'unset'));
  }, [maintenanceResources, filteredMaintenanceResources]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      {/* Fixed Sidebar */}
      <div className="flex-none">
        <Sidebar />
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-grow p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="p-2 sm:p-4 md:p-8 lg:p-12 min-h-screen mt-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-8"
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5">
                Resource Reports
              </h2>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={8}>
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
            <Col xs={24} sm={12} lg={8}>
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
            <Col xs={24} sm={12} lg={8}>
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

          {/* Search and Filters */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-row items-center gap-2 w-full">
              <div className="flex-grow">
                <Input
                  placeholder="Search resources by name"
                  allowClear
                  prefix={<SearchOutlined />}
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Dropdown
                menu={{
                  items: [
                    { key: 'week', label: 'Last Week' },
                    { key: 'month', label: 'Last Month' },
                    { key: 'year', label: 'Last Year' }
                  ],
                  onClick: ({ key }) => setTimeRange(key),
                  selectedKeys: [timeRange]
                }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  icon={<FilterOutlined />}
                  size="large"
                  style={{ background: 'white', border: '1px solid #d9d9d9', borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
                />
              </Dropdown>
              <div>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size="large"
                    style={{ borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Defective Resources Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center text-xl font-bold text-green-900">
                <BarChartOutlined className="mr-2" />
                Defective Resources
              </div>
            </div>
            
            <Tabs
              defaultActiveKey="unset"
              items={[
                {
                  key: 'unset',
                  label: (
                    <span className="flex items-center">
                      <CloseCircleOutlined className="ml-4 text-red-500" />
                      <span className="hidden sm:inline">Unset</span>
                      <span className="sm:hidden">Unset</span>
                    </span>
                  ),
                  children: (
                    <div className="overflow-x-auto pr-8">
                      <Table
                        loading={loading}
                        pagination={{ 
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => `Total ${total} items`,
                          responsive: true
                        }}
                        columns={getColumnsForTab('unset')}
                        dataSource={filterResourcesByStatus(filteredMaintenanceResources, 'unset').map(resource => ({
                          key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                          ...resource
                        }))}
                        className="maintenance-table"
                        scroll={{ x: 'max-content' }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'done',
                  label: (
                    <span className="flex items-center">
                      <CheckCircleOutlined className="mr-2 text-green-500" />
                      <span className="hidden sm:inline">Done</span>
                      <span className="sm:hidden">Done</span>
                    </span>
                  ),
                  children: (
                    <div className="overflow-x-auto">
                      <Table
                        loading={loading}
                        pagination={{ 
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => `Total ${total} items`,
                          responsive: true
                        }}
                        columns={getColumnsForTab('done')}
                        dataSource={maintenanceResourcesWithStatus.map(resource => ({
                          key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                          ...resource
                        }))}
                        className="maintenance-table"
                        scroll={{ x: 'max-content' }}
                      />
                    </div>
                  ),
                }
              ]}
            />
            {/* Modal for Fixed/Cannot be Fixed */}
            <Modal
              title={selectedResource ? selectedResource.resource_name : 'Resource Details'}
              open={isModalOpen}
              onCancel={() => setIsModalOpen(false)}
              footer={[
                <Button
                  key="fixed"
                  type="primary"
                  onClick={() => handleUpdateResourceStatus(true)}
                >
                  Fixed
                </Button>,
                <Button
                  key="cannot"
                  danger
                  onClick={() => handleUpdateResourceStatus(false)}
                >
                  Cannot be Fixed
                </Button>
              ]}
            >
              <p>Choose an action for this resource.</p>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;