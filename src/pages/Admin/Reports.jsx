import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {Table, Tag, Button, Tabs, Input, Tooltip, Dropdown, Modal, Descriptions, Divider, Row, Col, Skeleton, Typography, Badge, Popconfirm, Space, Card, Drawer, Empty, Pagination} from 'antd';
import { motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import {
  // CarOutlined,
  // HomeOutlined,
  // ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  BarChartOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import Sidebar from '../../components/core/Sidebar';
import {SecureStorage} from '../../utils/encryption';

const Reports = () => {
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  
  const [maintenanceResources, setMaintenanceResources] = useState([]);
  const [maintenanceResourcesWithStatus, setMaintenanceResourcesWithStatus] = useState([]);
  // const [totalCounts, setTotalCounts] = useState({
  //   venues: 0,
  //   vehicles: 0,
  //   equipments: 0,
  //   venues_in_use: 0,
  //   vehicles_in_use: 0,
  //   equipments_in_use: 0
  // });
  const [timeRange, setTimeRange] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isDoneContext, setIsDoneContext] = useState(false); // track if modal opened from Done tab
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const baseUrl = SecureStorage.getLocalItem("url");

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

  const fetchMaintenanceResources = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/Assigned&Records.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'displayedMaintenanceResources'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setMaintenanceResources(data.data);
      } else {
        toast.error('Failed to fetch maintenance resources');
      }
    } catch (error) {
      console.error('Error fetching maintenance resources:', error);
      if (!navigator.onLine || error.message === 'Failed to fetch' || error.name === 'TypeError') {
        toast.error('Network connection lost. Cannot reach the server.');
      } else {
        toast.error('Error fetching maintenance resources');
      }
    }
  }, [baseUrl]);

  const fetchMaintenanceResourcesWithStatus = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/Assigned&Records.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'displayedMaintenanceResourcesDone'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setMaintenanceResourcesWithStatus(data.data);
      } else {
        toast.error('Failed to fetch maintenance resources with status');
      }
    } catch (error) {
      console.error('Error fetching maintenance resources with status:', error);
      if (!navigator.onLine || error.message === 'Failed to fetch' || error.name === 'TypeError') {
        toast.error('Network connection lost. Cannot reach the server.');
      } else {
        toast.error('Error fetching maintenance resources with status');
      }
    }
  }, [baseUrl]);

  const handleScheduleMaintenance = (record, originTab = 'unset') => {
    const resourceWithRecordId = {
      ...record,
      record_id: record.record_id || record.maintenance_id
    };
    setSelectedResource(resourceWithRecordId);
    setIsDoneContext(originTab === 'done');
    setIsModalOpen(true);
  };

  const handleUpdateResourceStatus = async (isFixed) => {
    if (!selectedResource) return;
    
    // Automatically generate admin remarks based on action
    const adminRemarks = isFixed ? 'Set to Available' : 'Set to Unavailable';
    
    try {
      const response = await fetch(`${baseUrl}/Assigned&Records.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: "updateResourceStatusAndCondition",
          type: selectedResource.resource_type,
          resourceId: selectedResource.resource_id, // or the correct field for your resource
          recordId: selectedResource.record_id || selectedResource.maintenance_id,
          user_personnel_id: SecureStorage.getLocalItem("user_id"),
          isFixed: isFixed,
          admin_remarks: adminRemarks
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.status === 'success') {
        toast.success(isFixed ? "Resource marked as available for use." : "Resource marked as unavailable.");
        setIsModalOpen(false);
        fetchMaintenanceResources();
        fetchMaintenanceResourcesWithStatus();
      } else {
        // Show error message from backend (including next request validation)
        toast.error(data.message || "Failed to update resource status.");
      }
    } catch (error) {
      console.error('Error updating resource status:', error);
      if (!navigator.onLine || error.message === 'Failed to fetch' || error.name === 'TypeError') {
        toast.error('Network connection lost. Cannot reach the server.');
      } else {
        toast.error("Failed to update resource status.");
      }
    }
  };

  // // Enhanced Resource Card Component
  // const ResourceCard = ({ title, stats, icon: Icon, color }) => (
  //   <motion.div
  //     whileHover={{ scale: 1.02 }}
  //     transition={{ duration: 0.2 }}
  //   >
  //     <Card 
  //       className="shadow-lg hover:shadow-xl transition-all duration-300 bg-[#fafff4] border-0"
  //       bodyStyle={{ padding: '1.5rem' }}
  //     >
  //       <div className="flex justify-between items-start">
  //         <div className="w-full">
  //           <h3 className="text-xl font-bold mb-6 text-green-900 flex items-center">
  //             {title}
  //             <Icon className="ml-2 text-2xl" />
  //           </h3>
  //           <div className="grid grid-cols-3 gap-6">
  //             <Statistic 
  //               title={<span className="text-gray-600">Total</span>} 
  //               value={stats.total}
  //               className="statistic-card"
  //             />
  //             <Statistic 
  //               title={<span className="text-gray-600">Available</span>}
  //               value={stats.available}
  //               valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
  //               className="statistic-card"
  //             />
  //             <Statistic
  //               title={<span className="text-gray-600">In Use</span>}
  //               value={stats.inUse}
  //               valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
  //               className="statistic-card"
  //             />
  //           </div>
  //         </div>
  //       </div>
  //     </Card>
  //   </motion.div>
  // );

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
        title: 'Status',
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
        title: 'Reported By',
        dataIndex: 'reported_by_name',
        key: 'reported_by_name',
        render: (val) => val || '—'
      },
      {
        title: 'Reported At',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date) => date ? new Date(date).toLocaleString() : '—'
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
            // Hide action for bulk/consumable equipment
            isBulkEquipment(record)
              ? null
              : (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleScheduleMaintenance(record)}
                  icon={<ExclamationCircleOutlined />}
                >
                  View Details
                </Button>
              )
          )
        }
      ];
    }

    // Add a simple View Details action for the Done tab (no status buttons in modal)
    if (tabKey === 'done') {
      return [
        ...baseColumns,
        {
          title: 'Action',
          key: 'action',
          render: (_, record) => (
            <Button
              type="default"
              size="small"
              onClick={() => handleScheduleMaintenance(record, 'done')}
            >
              View Details
            </Button>
          )
        }
      ];
    }

    return baseColumns;
  };

  // Detect Bulk/Consumable equipment entries
  const isBulkEquipment = (resource) => {
    const type = resource?.resource_type?.toLowerCase();
    // Direct type of equipment_bulk should also be treated as bulk equipment
    if (type === 'equipment_bulk') return true;
    const marker = (resource?.equip_type || resource?.type || resource?.category || '').toLowerCase();
    return type === 'equipment' && (marker === 'bulk' || marker === 'consumable');
  };

  // Consider items with condition_name that includes 'completed' or 'good' as done
  const isCompletedOrGood = (resource) => {
    const status = (resource?.condition_name || '').toLowerCase();
    return status.includes('completed') || status.includes('good');
  };

  // Columns for Bulk Equipment (display-only)
  const getBulkColumns = () => [
    {
      title: 'Equipment',
      dataIndex: 'resource_name',
      key: 'resource_name',
    },
    {
      title: 'Status',
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
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <span className="text-gray-700">
          {record?.reservation_title || record?.reservation_description || 'No description'}
        </span>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="default"
          size="small"
          onClick={() => handleScheduleMaintenance(record)}
          icon={<ExclamationCircleOutlined />}
        >
          View Details
        </Button>
      )
    }
  ];

  const handleRefresh = () => {
    fetchMaintenanceResources();
    fetchMaintenanceResourcesWithStatus();
    setSearchTerm('');
  };

  // Mobile card rendering functions
  const renderMobileCards = (data, tabKey) => {
    const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    
    if (!paginatedData || paginatedData.length === 0) {
      return (
        <div className="text-center py-12">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-500">
                No resources found
              </span>
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-3 p-3">
        {paginatedData.map((resource) => (
          <Card
            key={`${resource.resource_type}-${resource.record_id || resource.maintenance_id}`}
            className="bg-white border border-gray-200 rounded-lg shadow-sm"
            size="small"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag color={
                    resource.resource_type === 'venue' ? 'blue' :
                    resource.resource_type === 'vehicle' ? 'green' :
                    'purple'
                  }>
                    {resource.resource_type?.charAt(0).toUpperCase() + resource.resource_type?.slice(1)}
                  </Tag>
                  <span className="font-medium text-sm truncate max-w-[120px]">
                    {resource.resource_name}
                  </span>
                </div>
                <Tag color={
                  resource.condition_name?.toLowerCase().includes('completed') || resource.condition_name?.toLowerCase().includes('good')
                    ? 'green'
                    : resource.condition_name?.toLowerCase().includes('pending') || resource.condition_name?.toLowerCase().includes('inspection')
                      ? 'orange'
                      : resource.condition_name?.toLowerCase() === 'damaged'
                        ? 'red'
                        : 'default'
                }>
                  {resource.condition_name || 'Unset'}
                </Tag>
              </div>
              <div className="text-xs text-gray-600">
                <div>Reported by: {resource.reported_by_name || '—'}</div>
                <div>Reported at: {resource.created_at ? new Date(resource.created_at).toLocaleString() : '—'}</div>
              </div>
              {(tabKey === 'unset' && !isBulkEquipment(resource)) || tabKey === 'done' || tabKey === 'bulk' ? (
                <div className="flex justify-end">
                  <Button
                    size="small"
                    type={tabKey === 'done' ? 'default' : 'primary'}
                    onClick={() => handleScheduleMaintenance(resource, tabKey === 'done' ? 'done' : 'unset')}
                    icon={<ExclamationCircleOutlined />}
                  >
                    View Details
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const filteredMaintenanceResources = useMemo(() => {
    return maintenanceResources.filter(resource =>
      resource.resource_name && resource.resource_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [maintenanceResources, searchTerm]);

  useEffect(() => {
    fetchMaintenanceResources();
    fetchMaintenanceResourcesWithStatus();
  }, [timeRange, fetchMaintenanceResources, fetchMaintenanceResourcesWithStatus]);

  // Add debugging logs to help verify filtering
  useEffect(() => {
    console.log("maintenanceResources:", maintenanceResources);
    console.log("filteredMaintenanceResources:", filteredMaintenanceResources);
    console.log("Defective resources:", filterResourcesByStatus(filteredMaintenanceResources, 'unset'));
  }, [maintenanceResources, filteredMaintenanceResources]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      
      <div className={`flex-grow overflow-y-auto`}>
        <div className={`${isMobile ? 'px-4 py-4 mt-5' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto'} min-h-screen`}>
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4 mt-10">
              <h2 className="text-2xl font-bold text-green-900 mt-5">
                Resource Reports
              </h2>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          {/* <Row gutter={[16, 16]} className="mb-6">
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
          </Row> */}

          {/* Search and Filters */}
          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  placeholder={isMobile ? "Search..." : "Search resources by name"}
                  allowClear
                  prefix={<SearchOutlined />}
                  size={isMobile ? "middle" : "large"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className={`flex ${isMobile ? 'flex-col gap-2' : isTablet ? 'flex-wrap gap-2' : 'gap-2'}`}>
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
                    size={isMobile ? "middle" : "large"}
                    className={isMobile ? 'w-full' : ''}
                    style={!isMobile ? { background: 'white', border: '1px solid #d9d9d9', borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 } : {}}
                  >
                    {isMobile && 'Filter'}
                  </Button>
                </Dropdown>
                <Tooltip title="Refresh data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size={isMobile ? "middle" : "large"}
                    className={isMobile ? 'w-full' : ''}
                    style={!isMobile ? { borderRadius: 8, height: 40, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
                  >
                    {isMobile && 'Refresh'}
                  </Button>
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
                    <div>
                      {isMobile ? (
                        renderMobileCards(
                          filterResourcesByStatus(filteredMaintenanceResources, 'unset')
                            .filter(resource => !isBulkEquipment(resource))
                            .map(resource => ({
                              key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                              ...resource
                            })),
                          'unset'
                        )
                      ) : (
                        <div className="overflow-x-auto pr-8">
                          <Table
                            loading={false}
                            pagination={false}
                            columns={getColumnsForTab('unset')}
                            dataSource={filterResourcesByStatus(filteredMaintenanceResources, 'unset')
                              .filter(resource => !isBulkEquipment(resource))
                              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                              .map(resource => ({
                                key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                                ...resource
                              }))}
                            className="maintenance-table"
                            scroll={{ x: 'max-content' }}
                          />
                        </div>
                      )}
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
                    <div>
                      {isMobile ? (
                        renderMobileCards(
                          maintenanceResourcesWithStatus.map(resource => ({
                            key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                            ...resource
                          })),
                          'done'
                        )
                      ) : (
                        <div className="overflow-x-auto">
                          <Table
                            loading={false}
                            pagination={false}
                            columns={getColumnsForTab('done')}
                            dataSource={maintenanceResourcesWithStatus
                              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                              .map(resource => ({
                                key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                                ...resource
                              }))}
                            className="maintenance-table"
                            scroll={{ x: 'max-content' }}
                          />
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'bulk',
                  label: (
                    <span className="flex items-center">
                      <ExclamationCircleOutlined className="mr-2 text-orange-500" />
                      <span className="hidden sm:inline">Bulk Equipment</span>
                      <span className="sm:hidden">Bulk</span>
                    </span>
                  ),
                  children: (
                    <div>
                      {isMobile ? (
                        renderMobileCards(
                          filterResourcesByStatus(filteredMaintenanceResources, 'unset')
                            .filter(isBulkEquipment)
                            .map(resource => ({
                              key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                              ...resource
                            })),
                          'bulk'
                        )
                      ) : (
                        <div className="overflow-x-auto">
                          <Table
                            loading={false}
                            pagination={false}
                            columns={getBulkColumns()}
                            dataSource={filterResourcesByStatus(filteredMaintenanceResources, 'unset')
                              .filter(isBulkEquipment)
                              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                              .map(resource => ({
                                key: `${resource.resource_type}-${resource.record_id || resource.maintenance_id}`,
                                ...resource
                              }))}
                            className="maintenance-table"
                            scroll={{ x: 'max-content' }}
                          />
                        </div>
                      )}
                    </div>
                  ),
                }
              ]}
            />
            
            {/* Pagination */}
            <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredMaintenanceResources ? filteredMaintenanceResources.length : 0}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger={!isMobile}
                showTotal={!isMobile ? (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items` : false
                }
                size={isMobile ? "small" : "default"}
                className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}
                simple={isMobile}
              />
            </div>
            
            {/* Enhanced View Details Modal/Drawer */}
            {isMobile ? (
              <Drawer
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-100">
                        <Badge color="green" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-semibold text-gray-900">
                          {selectedResource ? selectedResource.resource_name : 'Resource Details'}
                        </span>
                        {selectedResource?.resource_type && (
                          <span className="text-xs text-gray-500">{selectedResource.resource_type?.charAt(0).toUpperCase() + selectedResource.resource_type?.slice(1)}</span>
                        )}
                      </div>
                    </div>
                    {selectedResource?.condition_name && (
                      <Tag color={selectedResource.condition_name?.toLowerCase().includes('available') ? 'green' : 'red'} className="text-xs">
                        {selectedResource.condition_name}
                      </Tag>
                    )}
                  </div>
                }
                placement="bottom"
                height="90%"
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                footer={
                  selectedResource && (isBulkEquipment(selectedResource) || isCompletedOrGood(selectedResource) || isDoneContext)
                    ? null
                    : (
                      <div className="flex flex-col gap-2 p-4">
                        <span className="text-xs text-gray-500 text-center mb-2">Update availability status</span>
                        <Popconfirm
                          title="Mark resource as Unavailable?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleUpdateResourceStatus(false)}
                        >
                          <Button key="unavailable" danger block size="large">
                            Set to Unavailable
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="Mark resource as Available for use?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleUpdateResourceStatus(true)}
                        >
                          <Button key="available" type="primary" className="bg-green-600 border-green-600 hover:bg-green-700" block size="large">
                            Available for Use
                          </Button>
                        </Popconfirm>
                      </div>
                    )
                }
              >
                <div style={{ paddingBottom: '120px' }}>
                  {!selectedResource ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                  ) : (
                    <div>
                      <Descriptions
                        column={1}
                        size="small"
                        colon
                        bordered
                        labelStyle={{ width: 140, color: '#6b7280' }}
                      >
                        <Descriptions.Item label="Resource Name">
                          <Typography.Text strong>{selectedResource.resource_name || '-'}</Typography.Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Type">
                          <Tag color="green" className="text-xs">
                            {selectedResource.resource_type?.charAt(0).toUpperCase() + selectedResource.resource_type?.slice(1) || '-'}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          <Typography.Text>{selectedResource.condition_name || 'Unset'}</Typography.Text>
                        </Descriptions.Item>
                        {isBulkEquipment(selectedResource) && (
                          <Descriptions.Item label="Quantity Issue">
                            <Typography.Text strong>
                              {selectedResource.quantity ?? '—'}
                            </Typography.Text>
                          </Descriptions.Item>
                        )}
                        {selectedResource.requester_name && (
                          <Descriptions.Item label="Requester">
                            <Typography.Text className="text-blue-600">{selectedResource.requester_name}</Typography.Text>
                          </Descriptions.Item>
                        )}
                        {selectedResource.reported_by_name && (
                          <Descriptions.Item label="Reported By">
                            <Typography.Text className="text-green-600">{selectedResource.reported_by_name}</Typography.Text>
                          </Descriptions.Item>
                        )}
                        {selectedResource.created_at && (
                          <Descriptions.Item label="Reported At">
                            <Typography.Text>{selectedResource.created_at}</Typography.Text>
                          </Descriptions.Item>
                        )}
                      </Descriptions>

                      {(selectedResource.reservation_title || selectedResource.reservation_description) ? (
                        <div className="mt-4 bg-white rounded-lg border border-gray-100 p-3">
                          <Divider className="my-2" />
                          {selectedResource.reservation_title && (
                            <div className="mb-1">
                              <Typography.Text strong>{selectedResource.reservation_title}</Typography.Text>
                            </div>
                          )}
                          {selectedResource.reservation_description && (
                            <Typography.Paragraph type="secondary" className="!mb-0 text-xs">
                              {selectedResource.reservation_description}
                            </Typography.Paragraph>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 bg-gray-50 rounded-lg p-4 text-center border border-dashed border-gray-200">
                          <Typography.Text type="secondary" className="text-xs">No reservation details</Typography.Text>
                        </div>
                      )}

                      {selectedResource.remarks && (
                        <div className="mt-4 bg-white rounded-lg border border-gray-100 p-3">
                          <Typography.Text className="text-gray-700 font-medium text-sm">Remarks</Typography.Text>
                          <Divider className="my-2" />
                          <Typography.Paragraph className="!mb-0 text-xs text-gray-600">
                            {selectedResource.remarks}
                          </Typography.Paragraph>
                        </div>
                      )}

                      {selectedResource.admin_remarks && isDoneContext && (
                        <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-3">
                          <Typography.Text className="text-green-700 font-medium text-sm">Admin Remarks</Typography.Text>
                          <Divider className="my-2" />
                          <Typography.Paragraph className="!mb-0 text-xs text-green-700">
                            {selectedResource.admin_remarks}
                          </Typography.Paragraph>
                        </div>
                      )}

                      {!isBulkEquipment(selectedResource) && !isCompletedOrGood(selectedResource) && !isDoneContext && (
                        <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
                          <Typography.Text className="text-gray-700 font-medium text-sm">Action</Typography.Text>
                          <Divider className="my-2" />
                          <Typography.Paragraph type="secondary" className="!mb-0 text-xs">
                            Choose the appropriate status for this resource using the buttons below.
                          </Typography.Paragraph>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Drawer>
            ) : (
              <Modal
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-100">
                        <Badge color="green" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-semibold text-gray-900">
                          {selectedResource ? selectedResource.resource_name : 'Resource Details'}
                        </span>
                        {selectedResource?.resource_type && (
                          <span className="text-xs text-gray-500">{selectedResource.resource_type?.charAt(0).toUpperCase() + selectedResource.resource_type?.slice(1)}</span>
                        )}
                      </div>
                    </div>
                    {selectedResource?.condition_name && (
                      <Tag color={selectedResource.condition_name?.toLowerCase().includes('available') ? 'green' : 'red'} className="text-xs">
                        {selectedResource.condition_name}
                      </Tag>
                    )}
                  </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                className="custom-modal"
                width={isTablet ? 700 : 800}
                footer={
                  selectedResource && (isBulkEquipment(selectedResource) || isCompletedOrGood(selectedResource) || isDoneContext)
                    ? null
                    : (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs text-gray-500">Update availability status</span>
                        <Space>
                          <Popconfirm
                            title="Mark resource as Unavailable?"
                            okText="Yes"
                            cancelText="No"
                            onConfirm={() => handleUpdateResourceStatus(false)}
                          >
                            <Button key="unavailable" danger>
                              Set to Unavailable
                            </Button>
                          </Popconfirm>
                          <Popconfirm
                            title="Mark resource as Available for use?"
                            okText="Yes"
                            cancelText="No"
                            onConfirm={() => handleUpdateResourceStatus(true)}
                          >
                            <Button key="available" type="primary" className="bg-green-600 border-green-600 hover:bg-green-700">
                              Available for Use
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    )
                }
              >
                {!selectedResource ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={14}>
                        <Descriptions
                          column={1}
                          size="small"
                          colon
                          bordered
                          labelStyle={{ width: 140, color: '#6b7280' }}
                        >
                          <Descriptions.Item label="Resource Name">
                            <Typography.Text strong>{selectedResource.resource_name || '-'}</Typography.Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Type">
                            <Tag color="green" className="text-xs">
                              {selectedResource.resource_type?.charAt(0).toUpperCase() + selectedResource.resource_type?.slice(1) || '-'}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Status">
                            <Typography.Text>{selectedResource.condition_name || 'Unset'}</Typography.Text>
                          </Descriptions.Item>
                          {isBulkEquipment(selectedResource) && (
                            <Descriptions.Item label="Quantity Issue">
                              <Typography.Text strong>
                                {selectedResource.quantity ?? '—'}
                              </Typography.Text>
                            </Descriptions.Item>
                          )}
                          {selectedResource.requester_name && (
                            <Descriptions.Item label="Requester">
                              <Typography.Text className="text-blue-600">{selectedResource.requester_name}</Typography.Text>
                            </Descriptions.Item>
                          )}
                          {selectedResource.reported_by_name && (
                            <Descriptions.Item label="Reported By">
                              <Typography.Text className="text-green-600">{selectedResource.reported_by_name}</Typography.Text>
                            </Descriptions.Item>
                          )}
                          {selectedResource.created_at && (
                            <Descriptions.Item label="Reported At">
                              <Typography.Text>{selectedResource.created_at}</Typography.Text>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Col>
                      <Col xs={24} md={10}>
                        {(selectedResource.reservation_title || selectedResource.reservation_description) ? (
                          <div className="bg-white rounded-lg border border-gray-100 p-3">
                            <Divider className="my-2" />
                            {selectedResource.reservation_title && (
                              <div className="mb-1">
                                <Typography.Text strong>{selectedResource.reservation_title}</Typography.Text>
                              </div>
                            )}
                            {selectedResource.reservation_description && (
                              <Typography.Paragraph type="secondary" className="!mb-0 text-xs">
                                {selectedResource.reservation_description}
                              </Typography.Paragraph>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4 text-center border border-dashed border-gray-200">
                            <Typography.Text type="secondary" className="text-xs">No reservation details</Typography.Text>
                          </div>
                        )}
                      </Col>
                    </Row>

                    {selectedResource.remarks && (
                      <div className="mt-4 bg-white rounded-lg border border-gray-100 p-3">
                        <Typography.Text className="text-gray-700 font-medium text-sm">Remarks</Typography.Text>
                        <Divider className="my-2" />
                        <Typography.Paragraph className="!mb-0 text-xs text-gray-600">
                          {selectedResource.remarks}
                        </Typography.Paragraph>
                      </div>
                    )}

                    {selectedResource.admin_remarks && isDoneContext && (
                      <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-3">
                        <Typography.Text className="text-green-700 font-medium text-sm">Admin Remarks</Typography.Text>
                        <Divider className="my-2" />
                        <Typography.Paragraph className="!mb-0 text-xs text-green-700">
                          {selectedResource.admin_remarks}
                        </Typography.Paragraph>
                      </div>
                    )}

                    {!isBulkEquipment(selectedResource) && !isCompletedOrGood(selectedResource) && !isDoneContext && (
                      <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
                        <Typography.Text className="text-gray-700 font-medium text-sm">Action</Typography.Text>
                        <Divider className="my-2" />
                        <Typography.Paragraph type="secondary" className="!mb-0 text-xs">
                          Choose the appropriate status for this resource using the buttons below.
                        </Typography.Paragraph>
                      </div>
                    )}
                  </div>
                )}
              </Modal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;