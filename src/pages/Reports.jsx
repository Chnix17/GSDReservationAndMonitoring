import React, { useState, useEffect } from 'react';
import { Card, Statistic, Table, Tag, Select, DatePicker, Button } from 'antd';
import { motion } from 'framer-motion';
import {
  CarOutlined,
  HomeOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from './Sidebar';
import { Line, Pie } from '@ant-design/plots';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [maintenanceResources, setMaintenanceResources] = useState([]);
  const [conditionStats, setConditionStats] = useState({ good: 0, poor: 0 });
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

  useEffect(() => {
    fetchAvailabilityStats();
    fetchUsageStats();
    fetchMaintenanceResources();
    fetchConditionStats();
  }, [timeRange]);

  const fetchAvailabilityStats = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
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
  };

  const calculateStats = (items) => {
    const total = items.length;
    const available = items.filter(item => item.status_availability_name === 'Available').length;
    return {
      total,
      available,
      inUse: total - available
    };
  };

  const fetchUsageStats = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
        operation: 'fetchUsageHistory',
        timeRange
      });

      if (response.data.status === 'success') {
        setUsageHistory(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching usage statistics');
    }
  };

  const fetchTotals = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
        operation: 'getTotals'
      });

      if (response.data.status === 'success') {
        setTotalCounts(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching totals');
    }
  };

  const fetchMaintenanceResources = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
        operation: 'displayedMaintenanceResources'
      });

      if (response.data.status === 'success') {
        setMaintenanceResources(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching maintenance resources');
    }
  };

  const fetchConditionStats = async () => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
        operation: 'countMaintenanceResources'
      });

      if (response.data.status === 'success') {
        setConditionStats(response.data.data);
      }
    } catch (error) {
      toast.error('Error fetching condition statistics');
    }
  };

  const handleMakeAvailable = async (recordId, resourceType, resourceId) => {
    try {
      const response = await axios.post('http://localhost/coc/gsd/get_totals.php', {
        operation: 'updateSingleResourceAvailability',
        type: resourceType,
        resource_id: resourceId,
        record_id: recordId
      });

      if (response.data.status === 'success') {
        toast.success('Resource status updated successfully');
        // Refresh all the relevant data
        fetchMaintenanceResources();
        fetchAvailabilityStats();
        fetchConditionStats();
      } else {
        toast.error(response.data.message || 'Failed to update resource status');
      }
    } catch (error) {
      toast.error('Error updating resource status');
      console.error(error);
    }
  };

  // Resource Status Cards
  const ResourceCard = ({ title, stats, icon: Icon, color }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="grid grid-cols-3 gap-4">
            <Statistic title="Total" value={stats.total} />
            <Statistic 
              title="Available" 
              value={stats.available}
              valueStyle={{ color: '#3f8600' }}
            />
            <Statistic
              title="In Use"
              value={stats.inUse}
              valueStyle={{ color: '#cf1322' }}
            />
          </div>
        </div>
        <Icon className={`text-4xl ${color}`} />
      </div>
    </Card>
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
  const ConditionChart = ({ data }) => {
    const config = {
      data,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        text: (datum) => `${datum.type}: ${datum.value}%`,
        position: 'spider'
      }
    };

    return <Pie {...config} />;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Resource Reports</h1>

            <Select
              defaultValue="week"
              onChange={setTimeRange}
              options={[
                { value: 'week', label: 'Last Week' },
                { value: 'month', label: 'Last Month' },
                { value: 'year', label: 'Last Year' }
              ]}
              className="w-48"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">Venues</h3>
                  <div className="flex justify-between gap-4">
                    <Statistic title="Total" value={totalCounts.venues || 0} />
                    <Statistic 
                      title="Available" 
                      value={totalCounts.venues - totalCounts.venues_in_use} 
                      valueStyle={{ color: '#3f8600' }}
                    />
                    <Statistic 
                      title="In Use" 
                      value={totalCounts.venues_in_use} 
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </div>
                </div>
                <HomeOutlined className="text-4xl text-blue-500 ml-4" />
              </div>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">Vehicles</h3>
                  <div className="flex justify-between gap-4">
                    <Statistic title="Total" value={totalCounts.vehicles || 0} />
                    <Statistic 
                      title="Available" 
                      value={totalCounts.vehicles - totalCounts.vehicles_in_use} 
                      valueStyle={{ color: '#3f8600' }}
                    />
                    <Statistic 
                      title="In Use" 
                      value={totalCounts.vehicles_in_use} 
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </div>
                </div>
                <CarOutlined className="text-4xl text-green-500 ml-4" />
              </div>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <h3 className="text-lg font-semibold mb-4">Equipment</h3>
                  <div className="flex justify-between gap-4">
                    <Statistic title="Total" value={totalCounts.equipments || 0} />
                    <Statistic 
                      title="Available" 
                      value={totalCounts.equipments - totalCounts.equipments_in_use} 
                      valueStyle={{ color: '#3f8600' }}
                    />
                    <Statistic 
                      title="In Use" 
                      value={totalCounts.equipments_in_use} 
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </div>
                </div>
                <ToolOutlined className="text-4xl text-purple-500 ml-4" />
              </div>
            </Card>
          </div>

          

          <div className="grid grid-cols-1 gap-6">
            

            <Card title="Resources Under Maintenance" className="shadow-md">
              <Table
                loading={loading}
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'Resource Name',
                    dataIndex: 'resource_name',
                    key: 'resource_name',
                  },
                  {
                    title: 'Type',
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
                    title: 'Status Availability',
                    dataIndex: 'condition_name',
                    key: 'condition_name',
                    render: (condition) => (
                      <Tag color="red">
                        {condition}
                      </Tag>
                    )
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleMakeAvailable(record.record_id, record.resource_type, record.resource_id)}
                        icon={<CheckCircleOutlined />}
                      >
                        Make Available
                      </Button>
                    )
                  }
                ]}
                dataSource={maintenanceResources.map(resource => ({
                  key: `${resource.resource_type}-${resource.record_id}`,
                  resource_name: resource.resource_name,
                  resource_type: resource.resource_type,
                  condition_name: resource.condition_name,
                  record_id: resource.record_id,
                  resource_id: resource.resource_id
                }))}
              />
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;