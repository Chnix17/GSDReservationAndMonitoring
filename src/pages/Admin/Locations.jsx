import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import Sidebar from '../../components/core/Sidebar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { motion } from 'framer-motion';
import { SecureStorage } from '../../utils/encryption';
import { Button, Input, Modal, Select, Table, Tooltip } from 'antd';
import { EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

const Locations = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const navigate = useNavigate();
  const encryptedUrl = SecureStorage.getLocalItem('url');
  const encryptedUserLevel = SecureStorage.getLocalItem('user_level_id');
  const userId = SecureStorage.getSessionItem('user_id') || SecureStorage.getLocalItem('user_id') || null;

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createCategoryId, setCreateCategoryId] = useState(null);

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateId, setUpdateId] = useState(null);
  const [updateName, setUpdateName] = useState('');
  const [updateCategoryId, setUpdateCategoryId] = useState(null);

  useEffect(() => {
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
      localStorage.clear();
      navigate('/');
    }
  }, [navigate, encryptedUserLevel]);

  const fetchLocationCategories = useCallback(async () => {
    if (!encryptedUrl) return;
    try {
      const response = await axios.post(
        `${encryptedUrl}/Admin.php`,
        { operation: 'fetchLocationCategory' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching location categories:', error);
      setCategories([]);
    }
  }, [encryptedUrl]);

  const fetchLocations = useCallback(async () => {
    if (!encryptedUrl) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `${encryptedUrl}/Admin.php`,
        { operation: 'fetchLocation' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        setLocations(response.data.data);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('An error occurred while fetching locations.');
      }
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  useEffect(() => {
    fetchLocationCategories();
    fetchLocations();
  }, [fetchLocationCategories, fetchLocations]);

  const filteredLocations = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => {
      const name = String(l.location_name || '').toLowerCase();
      const cat = String(l.locCateg_name || l.location_categoryname || '').toLowerCase();
      const id = String(l.location_id ?? '').toLowerCase();
      return name.includes(q) || cat.includes(q) || id.includes(q);
    });
  }, [locations, searchTerm]);

  const resetCreate = useCallback(() => {
    setCreateName('');
    setCreateCategoryId(null);
  }, []);

  const resetUpdate = useCallback(() => {
    setUpdateId(null);
    setUpdateName('');
    setUpdateCategoryId(null);
  }, []);

  const handleCreate = useCallback(async () => {
    const name = String(createName || '').trim();

    if (!name) {
      toast.error('Location name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        operation: 'createLocation',
        location_name: name,
        location_categoryId: createCategoryId,
        userid: userId
      };

      const response = await axios.post(
        `${encryptedUrl}/Admin.php`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.status === 'success') {
        toast.success(response.data?.message || 'Location created.');
        setIsCreateOpen(false);
        resetCreate();
        fetchLocations();
      } else {
        toast.error(response.data?.message || 'Failed to create location.');
      }
    } catch (error) {
      console.error('Error creating location:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('An error occurred while creating location.');
      }
    } finally {
      setLoading(false);
    }
  }, [createName, createCategoryId, encryptedUrl, fetchLocations, resetCreate, userId]);

  const handleOpenUpdate = useCallback((record) => {
    setUpdateId(record.location_id);
    setUpdateName(record.location_name || '');
    setUpdateCategoryId(record.location_categoryId ?? null);
    setIsUpdateOpen(true);
  }, []);

  const handleUpdate = useCallback(async () => {
    const name = String(updateName || '').trim();
    if (!updateId) {
      toast.error('Invalid location selected.');
      return;
    }
    if (!name) {
      toast.error('Location name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        operation: 'updateLocation',
        location_id: updateId,
        location_name: name,
        location_categoryId: updateCategoryId,
        userid: userId
      };

      const response = await axios.post(
        `${encryptedUrl}/Admin.php`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data?.status === 'success') {
        toast.success(response.data?.message || 'Location updated.');
        setIsUpdateOpen(false);
        resetUpdate();
        fetchLocations();
      } else {
        toast.error(response.data?.message || 'Failed to update location.');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine)) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else {
        toast.error('An error occurred while updating location.');
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl, fetchLocations, resetUpdate, updateCategoryId, updateId, updateName, userId]);

  const columns = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'location_id',
      key: 'location_id',
      width: 90
    },
    {
      title: 'Location Name',
      dataIndex: 'location_name',
      key: 'location_name'
    },
    {
      title: 'Category',
      dataIndex: 'locCateg_name',
      key: 'locCateg_name',
      render: (_, record) => record.locCateg_name || record.location_categoryname || '-'
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Edit">
          <Button icon={<EditOutlined />} onClick={() => handleOpenUpdate(record)} />
        </Tooltip>
      )
    }
  ], [handleOpenUpdate]);

  const headerPadding = isMobile ? 'px-4 py-4 mt-13' : isTablet ? 'px-6 py-6 mt-10' : 'px-8 py-6 mt-10 max-w-7xl mx-auto';

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className={`${headerPadding} min-h-screen`}>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${isMobile ? 'mb-3' : 'mb-4'}`}
          >
            <div className="mb-2 sm:mb-4">
              <h2 className="text-2xl font-bold text-green-900 mt-5">Location Management</h2>
            </div>
          </motion.div>

          <div className={`bg-[#fafff4] ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-sm ${isMobile ? 'mb-4' : 'mb-5'}`}>
            <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-row items-center gap-2'} w-full`}>
              <div className="flex-grow">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isMobile ? 'Search locations...' : 'Search by ID, Location name, or Category'}
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
                    onClick={() => {
                      fetchLocationCategories();
                      fetchLocations();
                      setSearchTerm('');
                    }}
                    size={isMobile ? 'middle' : 'large'}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isMobile && 'Refresh'}
                  </Button>
                </Tooltip>

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size={isMobile ? 'middle' : 'large'}
                  onClick={() => {
                    resetCreate();
                    setIsCreateOpen(true);
                  }}
                  className={`bg-green-900 hover:bg-lime-900 ${isMobile ? 'w-full' : ''}`}
                >
                  {isMobile ? 'Add' : 'Add Location'}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <Table
              rowKey="location_id"
              loading={loading}
              columns={columns}
              dataSource={filteredLocations}
              pagination={{ pageSize: isMobile ? 5 : isTablet ? 8 : 10 }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </div>
      </div>

      <Modal
        open={isCreateOpen}
        title="Create Location"
        onCancel={() => {
          setIsCreateOpen(false);
          resetCreate();
        }}
        onOk={handleCreate}
        okText={loading ? 'Saving...' : 'Save'}
        confirmLoading={loading}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Location Name</div>
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. MW" />
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Category</div>
            <Select
              value={createCategoryId}
              onChange={(v) => setCreateCategoryId(v)}
              placeholder="Select category"
              className="w-full"
              allowClear
            >
              {categories.map((c) => (
                <Option key={c.locCateg_id} value={Number(c.locCateg_id)}>
                  {c.locCateg_name}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>

      <Modal
        open={isUpdateOpen}
        title={updateId ? `Update Location #${updateId}` : 'Update Location'}
        onCancel={() => {
          setIsUpdateOpen(false);
          resetUpdate();
        }}
        onOk={handleUpdate}
        okText={loading ? 'Saving...' : 'Save'}
        confirmLoading={loading}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Location Name</div>
            <Input value={updateName} onChange={(e) => setUpdateName(e.target.value)} placeholder="Location name" />
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Category</div>
            <Select
              value={updateCategoryId}
              onChange={(v) => setUpdateCategoryId(v)}
              placeholder="Select category"
              className="w-full"
              allowClear
            >
              {categories.map((c) => (
                <Option key={c.locCateg_id} value={Number(c.locCateg_id)}>
                  {c.locCateg_name}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Locations;
