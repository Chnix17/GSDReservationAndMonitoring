import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Empty, Skeleton, Input, Tooltip } from 'antd';
import { UndoOutlined, UserOutlined, CarOutlined, HomeOutlined, ToolOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import Sidebar from '../../components/core/Sidebar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SecureStorage } from '../../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Archive = () => {
  const [value, setValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [equipmentUnits, setEquipmentUnits] = useState([]);
  const [vehicleMakes, setVehicleMakes] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [equipmentCategories, setEquipmentCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const encryptedUrl = SecureStorage.getLocalItem("url");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getLocalItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        navigate('/');
    }
  }, [navigate]);

  const handleChange = (newValue) => {
    setValue(newValue);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const convertUserType = (userType) => {
    const typeMapping = {
      'Dean': 'dept',
      'Admin': 'admin',
      'Driver': 'driver',
      'Personnel': 'personel',
      'User': 'user',
      'Principal': 'principal'
    };
    return typeMapping[userType] || userType.toLowerCase();
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveUser" },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.status === 'success') {
        const allUsers = response.data.data.map(user => ({
          users_id: user.id,
          users_fname: user.fname,
          users_mname: user.mname,
          users_lname: user.lname,
          users_email: user.email,
          users_school_id: user.school_id,
          users_contact_number: user.contact_number,
          users_pic: user.pic,
          departments_name: user.departments_name,
          user_level_name: user.user_level_name,
          role: convertUserType(user.user_level_desc),
          user_type: user.type
        }));
        setUsers(allUsers);
      } else {
        
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("An error occurred while fetching users.");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveVehicle" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching vehicles");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveVenue" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVenues(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching venues");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchEquipmentAndInactiveUnits" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        console.log('Equipment Details:', response.data.data);
        setEquipment(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching equipment");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchEquipmentUnits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveEquipmentUnits" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        console.log('Equipment Units Details:', response.data.data);
        setEquipmentUnits(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching equipment units:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching equipment units");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVehicleMakes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveVehicleMake" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVehicleMakes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle makes:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching vehicle makes");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVehicleCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveVehicleCategory" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVehicleCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle categories:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching vehicle categories");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVehicleModels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveVehicleModel" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVehicleModels(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching vehicle models");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchEquipmentCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveEquipmentCategory" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setEquipmentCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching equipment categories");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveDepartment" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching departments");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveHoliday" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setHolidays(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching holidays");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchBuildings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`,
        { operation: "fetchInactiveBuilding" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setBuildings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error("Error fetching buildings");
      }
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);



  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    // Fetch data based on selected tab
    switch (value) {
      case 0:
        fetchUsers();
        break;
      case 1:
        fetchVehicles();
        break;
      case 2:
        fetchVenues();
        break;
      case 3:
        fetchEquipment();
        break;
      case 4:
        fetchEquipmentUnits();
        break;
      case 5:
        fetchVehicleMakes();
        break;
      case 6:
        fetchVehicleCategories();
        break;
      case 7:
        fetchVehicleModels();
        break;
      case 8:
        fetchEquipmentCategories();
        break;
      case 9:
        fetchDepartments();
        break;
      case 10:
        fetchHolidays();
        break;
      case 11:
        fetchBuildings();
        break;
      default:
        break;
    }
  }, [value, fetchUsers, fetchVehicles, fetchVenues, fetchEquipment, fetchEquipmentUnits, fetchVehicleMakes, fetchVehicleCategories, fetchVehicleModels, fetchEquipmentCategories, fetchDepartments, fetchHolidays, fetchBuildings]);

  const handleRestoreUsers = async (record) => {
    let userIds;
    if (record) {
      // If restoring a single user from the action button
      userIds = [record.users_id];
    } else {
      // If restoring multiple users from bulk selection
      userIds = selectedRowKeys;
    }
    
    const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
    const payload = {
      operation: "unarchiveUser",
      userType: "user",
      userId: userIds,
      userid: userId
    };
    console.log('Restore Users Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'success') {
        message.success(`${userIds.length} users activated successfully`);
        setSelectedRowKeys([]);
        fetchUsers();
      } else {
        message.error(`Failed to activate users`);
      }
    } catch (error) {
      console.error('Error restoring users:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Cannot activate users. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        message.error(`An error occurred while activating users`);
      }
    }
  };

  const handleRestoreVehicles = async (record) => {
    let resourceIds;
    if (record) {
      // If restoring a single vehicle from the action button
      resourceIds = [record.vehicle_id];
    } else {
      // If restoring multiple vehicles from bulk selection
      resourceIds = selectedRowKeys;
    }
    
    const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
    const payload = {
      operation: "unarchiveResource",
      resourceType: "vehicle",
      resourceId: resourceIds,
      userid: userId
    };
    console.log('Restore Vehicles Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'success') {
        message.success(`${resourceIds.length} vehicles activated successfully`);
        setSelectedRowKeys([]);
        fetchVehicles();
      } else {
        message.error(`Failed to activate vehicles`);
      }
    } catch (error) {
      console.error('Error restoring vehicles:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Cannot activate vehicles. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        message.error(`An error occurred while activating vehicles`);
      }
    }
  };

  const handleRestoreVenues = async (record) => {
    let resourceIds;
    if (record) {
      // If restoring a single venue from the action button
      resourceIds = [record.ven_id];
    } else {
      // If restoring multiple venues from bulk selection
      resourceIds = selectedRowKeys;
    }
    
    const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
    const payload = {
      operation: "unarchiveResource",
      resourceType: "venue",
      resourceId: resourceIds,
      userid: userId
    };
    console.log('Restore Venues Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'success') {
        message.success(`${resourceIds.length} venues activated successfully`);
        setSelectedRowKeys([]);
        fetchVenues();
      } else {
        message.error(`Failed to activate venues`);
      }
    } catch (error) {
      console.error('Error restoring venues:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Cannot activate venues. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        message.error(`An error occurred while activating venues`);
      }
    }
  };

  const handleRestoreEquipment = async (record) => {
    let resourceIds;
    if (record) {
      resourceIds = [record.equip_id];
    } else {
      resourceIds = selectedRowKeys;
    }
    const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
    const payload = {
      operation: "unarchiveResource",
      resourceType: "equipment",
      resourceId: resourceIds,
      userid: userId
    };
    console.log('Restore Equipment Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.status === 'success') {
        message.success(`${resourceIds.length} equipment activated successfully`);
        setSelectedRowKeys([]);
        fetchEquipment();
      } else {
        message.error(`Failed to activate equipment`);
      }
    } catch (error) {
      console.error('Error restoring equipment:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Cannot activate equipment. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        message.error(`An error occurred while activating equipment`);
      }
    }
  };

  const handleRestoreEquipmentUnits = async (record) => {
    let resourceIds;
    if (record) {
      resourceIds = [record.unit_id];
    } else {
      resourceIds = selectedRowKeys;
    }
    const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
    const payload = {
      operation: "reactivateResource",
      resourceType: "equipment",
      resourceId: resourceIds,
      is_serialize: true,
      userid: userId
    };
    console.log('Restore Equipment Units Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.status === 'success') {
        message.success(`${resourceIds.length} equipment unit(s) activated successfully`);
        setSelectedRowKeys([]);
        fetchEquipmentUnits();
      } else {
        message.error(`Failed to activate equipment units`);
      }
    } catch (error) {
      console.error('Error restoring equipment units:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Cannot activate equipment units. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        message.error(`An error occurred while activating equipment units`);
      }
    }
  };

  const handleRestoreCatalogItem = async (itemType, record, idField, fetchFunction) => {
    let itemIds;
    if (record) {
      itemIds = [record[idField]];
    } else {
      itemIds = selectedRowKeys;
    }
    const userId = SecureStorage.getSessionItem("user_id") || SecureStorage.getLocalItem("user_id") || null;
    const payload = {
      operation: "unarchiveCatalogItem",
      itemType: itemType,
      itemId: itemIds,
      userid: userId
    };
    console.log('Restore Catalog Item Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/Admin.php`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.status === 'success') {
        message.success(response.data.message || `${itemIds.length} item(s) activated successfully`);
        setSelectedRowKeys([]);
        fetchFunction();
      } else {
        message.error(response.data.message || `Failed to activate items`);
      }
    } catch (error) {
      console.error('Error restoring catalog item:', error);
      if (!error.response && (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
        toast.error('Network connection lost. Cannot activate items. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        message.error(`An error occurred while activating items`);
      }
    }
  };

  const handleRestoreVehicleMakes = (record) => handleRestoreCatalogItem('vehicle_make', record, 'vehicle_make_id', fetchVehicleMakes);
  const handleRestoreVehicleCategories = (record) => handleRestoreCatalogItem('vehicle_category', record, 'vehicle_category_id', fetchVehicleCategories);
  const handleRestoreVehicleModels = (record) => handleRestoreCatalogItem('vehicle_model', record, 'vehicle_model_id', fetchVehicleModels);
  const handleRestoreEquipmentCategories = (record) => handleRestoreCatalogItem('equipment_category', record, 'equipments_category_id', fetchEquipmentCategories);
  const handleRestoreDepartments = (record) => handleRestoreCatalogItem('department', record, 'departments_id', fetchDepartments);
  const handleRestoreHolidays = (record) => handleRestoreCatalogItem('holiday', record, 'holiday_id', fetchHolidays);
  const handleRestoreBuildings = (record) => handleRestoreCatalogItem('building', record, 'venue_building_id', fetchBuildings);



 



  // Add global search function
  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter data based on search text
  const getFilteredData = (data) => {
    if (!searchText) return data;
    
    return data.filter(item => {
      return Object.values(item).some(val => 
        val && val.toString().toLowerCase().includes(searchText.toLowerCase())
      );
    });
  };

  const handleRefresh = () => {
    switch (value) {
      case 0:
        fetchUsers();
        break;
      case 1:
        fetchVehicles();
        break;
      case 2:
        fetchVenues();
        break;
      case 3:
        fetchEquipment();
        break;
      case 4:
        fetchEquipmentUnits();
        break;
      case 5:
        fetchVehicleMakes();
        break;
      case 6:
        fetchVehicleCategories();
        break;
      case 7:
        fetchVehicleModels();
        break;
      case 8:
        fetchEquipmentCategories();
        break;
      case 9:
        fetchDepartments();
        break;
      case 10:
        fetchHolidays();
        break;
      case 11:
        fetchBuildings();
        break;
      default:
        break;
    }
    setSearchText('');
    setCurrentPage(1);
  };

  const userColumns = [
    { 
      title: 'School ID/Employee ID', 
      dataIndex: 'users_school_id', 
      key: 'school_id',
      sorter: (a, b) => a.users_school_id.localeCompare(b.users_school_id),
      responsive: ['md'],
    },
    {
      title: 'Name',
      key: 'name',
      render: (text, record) => `${record.users_fname} ${record.users_mname} ${record.users_lname}`,
      sorter: (a, b) => `${a.users_fname} ${a.users_lname}`.localeCompare(`${b.users_fname} ${b.users_lname}`),
    },
    { 
      title: 'Email', 
      dataIndex: 'users_email', 
      key: 'email',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Department',
      dataIndex: 'departments_name',
      key: 'department',
      render: (text) => (
        <Tag color="blue">
          {text}
        </Tag>
      ),
      filters: [...new Set(users.map(user => user.departments_name))].map(dept => ({
        text: dept,
        value: dept,
      })),
      onFilter: (value, record) => record.departments_name === value,
      responsive: ['md'],
    },
    {
      title: 'User Level',
      dataIndex: 'user_level_name',
      key: 'userLevel',
      render: (text) => (
        <Tag color="green">
          {text}
        </Tag>
      ),
      filters: [...new Set(users.map(user => user.user_level_name))].map(level => ({
        text: level,
        value: level,
      })),
      onFilter: (value, record) => record.user_level_name === value,
    },
    { 
      title: 'Contact', 
      dataIndex: 'users_contact_number', 
      key: 'contact',
      responsive: ['lg'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Activate this user?"
            description="This will move the user back to active status."
            onConfirm={() => handleRestoreUsers(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
              <span className="sm:hidden">A</span>
            </Button>
          </Popconfirm>
         
        </Space>
      ),
    }
  ];

  const vehicleColumns = [
    { 
      title: 'License', 
      dataIndex: 'vehicle_license', 
      key: 'license',
      sorter: (a, b) => a.vehicle_license.localeCompare(b.vehicle_license),
    },
    { 
      title: 'Make', 
      dataIndex: 'vehicle_make_name', 
      key: 'make',
      filters: [...new Set(vehicles.map(vehicle => vehicle.vehicle_make_name))].map(make => ({
        text: make,
        value: make,
      })),
      onFilter: (value, record) => record.vehicle_make_name === value,
      responsive: ['md'],
    },
    { 
      title: 'Model', 
      dataIndex: 'vehicle_model_name', 
      key: 'model',
      responsive: ['lg'],
    },
    { 
      title: 'Category', 
      dataIndex: 'vehicle_category_name', 
      key: 'category',
      render: (text) => (
        <Tag color="purple">
          {text}
        </Tag>
      ),
      responsive: ['md'],
    },
    { 
      title: 'Year', 
      dataIndex: 'year', 
      key: 'year',
      sorter: (a, b) => a.year - b.year,
      responsive: ['lg'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Activate this vehicle?"
            description="This will move the vehicle back to active status."
            onConfirm={() => handleRestoreVehicles(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
              <span className="sm:hidden">A</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const venueColumns = [
    { 
      title: 'Name', 
      dataIndex: 'ven_name', 
      key: 'name',
      sorter: (a, b) => a.ven_name.localeCompare(b.ven_name),
    },
    { 
      title: 'Occupancy', 
      dataIndex: 'ven_occupancy', 
      key: 'occupancy',
      sorter: (a, b) => a.ven_occupancy - b.ven_occupancy,
      render: (text) => `${text} people`,
      responsive: ['md'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Activate this venue?"
            description="This will move the venue back to active status."
            onConfirm={() => handleRestoreVenues(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
              <span className="sm:hidden">A</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const equipmentColumns = [
    { 
      title: 'Name', 
      dataIndex: 'equip_name', 
      key: 'name',
      sorter: (a, b) => a.equip_name.localeCompare(b.equip_name),
    },
    {
      title: 'Type',
      dataIndex: 'equip_type',
      key: 'equip_type',
      render: (text) => text || 'Not specified',
      responsive: ['md'],
    },
    {
      title: 'Total Units',
      dataIndex: 'total_units',
      key: 'total_units',
      render: (text) => text || '0',
      responsive: ['lg'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Activate this equipment?"
            description="This will move the equipment back to active status."
            onConfirm={() => handleRestoreEquipment(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
              <span className="sm:hidden">A</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];



  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <p className="text-gray-500">No deactive data found</p>
      }
    />
  );

  const renderSkeletonLoader = () => (
    <div className="p-4">
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  // Tab components
  const tabItems = [
    { key: 0, label: 'Users', icon: <UserOutlined /> },
    { key: 1, label: 'Vehicles', icon: <CarOutlined /> },
    { key: 2, label: 'Venues', icon: <HomeOutlined /> },
    { key: 3, label: 'Equipment', icon: <ToolOutlined /> },
    { key: 4, label: 'Equipment Units', icon: <ToolOutlined /> },
    { key: 5, label: 'Vehicle Makes', icon: <CarOutlined /> },
    { key: 6, label: 'Vehicle Categories', icon: <CarOutlined /> },
    { key: 7, label: 'Vehicle Models', icon: <CarOutlined /> },
    { key: 8, label: 'Equipment Categories', icon: <ToolOutlined /> },
    { key: 9, label: 'Departments', icon: <HomeOutlined /> },
    { key: 10, label: 'Holidays', icon: <HomeOutlined /> },
    { key: 11, label: 'Buildings', icon: <HomeOutlined /> }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const renderBulkActions = () => {
    if (selectedRowKeys.length === 0) return null;

    const handleRestore = () => {
      switch (value) {
        case 0:
          handleRestoreUsers();
          break;
        case 1:
          handleRestoreVehicles();
          break;
        case 2:
          handleRestoreVenues();
          break;
        case 3:
          handleRestoreEquipment();
          break;
        case 4:
          handleRestoreEquipmentUnits();
          break;
        case 5:
          handleRestoreVehicleMakes();
          break;
        case 6:
          handleRestoreVehicleCategories();
          break;
        case 7:
          handleRestoreVehicleModels();
          break;
        case 8:
          handleRestoreEquipmentCategories();
          break;
        case 9:
          handleRestoreDepartments();
          break;
        case 10:
          handleRestoreHolidays();
          break;
        case 11:
          handleRestoreBuildings();
          break;
        default:
          break;
      }
    };

    return (
      <div className="mb-4">
        <Button
          type="primary"
          icon={<UndoOutlined />}
          onClick={handleRestore}
          className="bg-green-900 hover:bg-lime-900"
        >
          Activate Selected ({selectedRowKeys.length})
        </Button>
      </div>
    );
  };

  const getCurrentData = () => {
    const filteredData = getFilteredData(
      value === 0 ? users :
      value === 1 ? vehicles :
      value === 2 ? venues :
      value === 3 ? equipment :
      value === 4 ? equipmentUnits :
      value === 5 ? vehicleMakes :
      value === 6 ? vehicleCategories :
      value === 7 ? vehicleModels :
      value === 8 ? equipmentCategories :
      value === 9 ? departments :
      value === 10 ? holidays :
      value === 11 ? buildings : []
    );
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  };

  const equipmentUnitsColumns = [
    { 
      title: 'Equipment Name', 
      dataIndex: 'equip_name', 
      key: 'name',
      sorter: (a, b) => a.equip_name.localeCompare(b.equip_name),
    },
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      render: (text) => text || 'N/A',
      responsive: ['md'],
    },
    {
      title: 'Type',
      dataIndex: 'equip_type',
      key: 'equip_type',
      render: (text) => text || 'Not specified',
      responsive: ['lg'],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Activate this equipment unit?"
            description="This will move the equipment unit back to active status."
            onConfirm={() => handleRestoreEquipmentUnits(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
              <span className="sm:hidden">A</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // Vehicle Makes Columns
  const vehicleMakesColumns = [
    { title: 'Make Name', dataIndex: 'vehicle_make_name', key: 'name', sorter: (a, b) => a.vehicle_make_name.localeCompare(b.vehicle_make_name) },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="Activate this vehicle make?" onConfirm={() => handleRestoreVehicleMakes(record)} okText="Yes" cancelText="No" placement="left">
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // Vehicle Categories Columns
  const vehicleCategoriesColumns = [
    { title: 'Category Name', dataIndex: 'vehicle_category_name', key: 'name', sorter: (a, b) => a.vehicle_category_name.localeCompare(b.vehicle_category_name) },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="Activate this vehicle category?" onConfirm={() => handleRestoreVehicleCategories(record)} okText="Yes" cancelText="No" placement="left">
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // Vehicle Models Columns
  const vehicleModelsColumns = [
    { title: 'Model Name', dataIndex: 'vehicle_model_name', key: 'name', sorter: (a, b) => a.vehicle_model_name.localeCompare(b.vehicle_model_name) },
    { title: 'Make', dataIndex: 'vehicle_make_name', key: 'make', responsive: ['md'] },
    { title: 'Category', dataIndex: 'vehicle_category_name', key: 'category', responsive: ['md'] },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="Activate this vehicle model?" onConfirm={() => handleRestoreVehicleModels(record)} okText="Yes" cancelText="No" placement="left">
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // Equipment Categories Columns
  const equipmentCategoriesColumns = [
    { title: 'Category Name', dataIndex: 'equipments_category_name', key: 'name', sorter: (a, b) => a.equipments_category_name.localeCompare(b.equipments_category_name) },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="Activate this equipment category?" onConfirm={() => handleRestoreEquipmentCategories(record)} okText="Yes" cancelText="No" placement="left">
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // Departments Columns
  const departmentsColumns = [
    { title: 'Department Name', dataIndex: 'departments_name', key: 'name', sorter: (a, b) => a.departments_name.localeCompare(b.departments_name) },
    { title: 'Type', dataIndex: 'department_type', key: 'type', render: (text) => <Tag color="blue">{text}</Tag>, responsive: ['md'] },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="Activate this department?" onConfirm={() => handleRestoreDepartments(record)} okText="Yes" cancelText="No" placement="left">
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // Holidays Columns
  const holidaysColumns = [
    { title: 'Holiday Name', dataIndex: 'holiday_name', key: 'name', sorter: (a, b) => a.holiday_name.localeCompare(b.holiday_name) },
    { title: 'Date', dataIndex: 'holiday_date', key: 'date', responsive: ['md'] },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="Activate this holiday?" onConfirm={() => handleRestoreHolidays(record)} okText="Yes" cancelText="No" placement="left">
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  // Buildings Columns
  const buildingsColumns = [
    { title: 'Building Name', dataIndex: 'venue_building_name', key: 'name', sorter: (a, b) => a.venue_building_name.localeCompare(b.venue_building_name) },
    {
      title: 'Action', key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="Activate this building?" onConfirm={() => handleRestoreBuildings(record)} okText="Yes" cancelText="No" placement="left">
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Activate</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const getCurrentColumns = () => {
    switch (value) {
      case 0: return userColumns;
      case 1: return vehicleColumns;
      case 2: return venueColumns;
      case 3: return equipmentColumns;
      case 4: return equipmentUnitsColumns;
      case 5: return vehicleMakesColumns;
      case 6: return vehicleCategoriesColumns;
      case 7: return vehicleModelsColumns;
      case 8: return equipmentCategoriesColumns;
      case 9: return departmentsColumns;
      case 10: return holidaysColumns;
      case 11: return buildingsColumns;
      default: return [];
    }
  };

  const getCurrentRowKey = () => {
    switch (value) {
      case 0: return 'users_id';
      case 1: return 'vehicle_id';
      case 2: return 'ven_id';
      case 3: return 'equip_id';
      case 4: return 'unit_id';
      case 5: return 'vehicle_make_id';
      case 6: return 'vehicle_category_id';
      case 7: return 'vehicle_model_id';
      case 8: return 'equipments_category_id';
      case 9: return 'departments_id';
      case 10: return 'holiday_id';
      case 11: return 'venue_building_id';
      default: return 'id';
    }
  };

  const getFilteredDataLength = () => {
    return getFilteredData(
      value === 0 ? users :
      value === 1 ? vehicles :
      value === 2 ? venues :
      value === 3 ? equipment :
      value === 4 ? equipmentUnits :
      value === 5 ? vehicleMakes :
      value === 6 ? vehicleCategories :
      value === 7 ? vehicleModels :
      value === 8 ? equipmentCategories :
      value === 9 ? departments :
      value === 10 ? holidays :
      value === 11 ? buildings : []
    ).length;
  };

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
              <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-15">
                Deactivate Data   
              </h2>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-row items-center gap-2 w-full">
              <div className="flex-grow">
                <Input
                  placeholder="Search across all fields..."
                  allowClear
                  prefix={<SearchOutlined />}
                  size="large"
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
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

          {/* Tabs Navigation */}
          <div className="bg-[#fafff4] p-4 rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px space-x-2 sm:space-x-8 overflow-x-auto">
                {tabItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleChange(item.key)}
                    className={`py-2 sm:py-4 px-1 flex items-center space-x-1 sm:space-x-2 font-medium text-xs sm:text-sm border-b-2 transition-colors duration-200 whitespace-nowrap ${
                      value === item.key 
                        ? 'border-green-900 text-green-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm sm:text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {loading ? (
                renderSkeletonLoader()
              ) : (
                <div>
                  {renderBulkActions()}
                  
                  {/* Table */}
                  <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#fafff4] dark:bg-green-100" style={{ minWidth: '100%' }}>
                    <Table 
                      rowSelection={rowSelection}
                      columns={getCurrentColumns()} 
                      dataSource={getCurrentData()}
                      rowKey={getCurrentRowKey()}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      bordered
                      size="middle"
                      className="deactive-data-table"
                      locale={{ emptyText: renderEmptyState() }}
                    />
                    
                    {/* Custom Pagination */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, getFilteredDataLength())} of {getFilteredDataLength()} items
                        </span>
                        <div className="flex items-center space-x-2">
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-sm text-gray-600">per page</span>
                        </div>
                      </div>
                      <div className="flex justify-center mt-4">
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            size="small"
                          >
                            Previous
                          </Button>
                          {Array.from({ length: Math.ceil(getFilteredDataLength() / pageSize) }, (_, i) => i + 1)
                            .filter(page => page === 1 || page === Math.ceil(getFilteredDataLength() / pageSize) || Math.abs(page - currentPage) <= 1)
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="px-2 py-1">...</span>
                                )}
                                <Button
                                  onClick={() => setCurrentPage(page)}
                                  type={currentPage === page ? 'primary' : 'default'}
                                  size="small"
                                  className={currentPage === page ? 'bg-green-900 hover:bg-lime-900' : ''}
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            ))
                          }
                          <Button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage >= Math.ceil(getFilteredDataLength() / pageSize)}
                            size="small"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
