<<<<<<< HEAD
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UndoOutlined,
  FileSearchOutlined,
  UserOutlined,
  CarOutlined,
  HomeOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { SecureStorage } from "../utils/encryption";
import Sidebar from "./Sidebar";
import axios from "axios";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const { Search } = Input;
const { Option } = Select;

const Archive = () => {
  const [activeTab, setActiveTab] = useState("users");
=======
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Tag, Empty, Skeleton, Input, Tooltip } from 'antd';
import { UndoOutlined, UserOutlined, CarOutlined, HomeOutlined, ToolOutlined, DeleteOutlined, SearchOutlined, IdcardOutlined, ReloadOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SecureStorage } from '../utils/encryption';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Archive = () => {
  const [value, setValue] = useState(0);
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [venues, setVenues] = useState([]);
  const [equipment, setEquipment] = useState([]);
<<<<<<< HEAD
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
=======
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
  const navigate = useNavigate();

  const encryptedUrl = SecureStorage.getLocalItem("url");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
<<<<<<< HEAD
    const user_level_id = SecureStorage.getSessionItem("user_level_id");
    if (
      user_level_id !== "1" &&
      user_level_id !== "2" &&
      user_level_id !== "4"
    ) {
      localStorage.clear();
      navigate("/gsd");
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const filtered = getCurrentData().filter((item) => {
      const searchFields = getSearchFields(item);
      return searchFields.some((field) =>
        field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, users, vehicles, venues, equipment, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case "users":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchAllUserTypes" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setUsers(response.data.data);
          }
          break;
        case "vehicles":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchAllVehicles" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setVehicles(response.data.data);
          }
          break;
        case "venues":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchVenue" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setVenues(response.data.data);
          }
          break;
        case "equipment":
          response = await axios.post(
            `${encryptedUrl}/delete_master.php`,
            { operation: "fetchEquipmentsWithStatus" },
            { headers: { "Content-Type": "application/json" } }
          );
          if (response.data.status === "success") {
            setEquipment(response.data.data);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Error fetching ${activeTab}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "users":
        return users;
      case "vehicles":
        return vehicles;
      case "venues":
        return venues;
      case "equipment":
        return equipment;
      default:
        return [];
    }
  };

  const getSearchFields = (item) => {
    switch (activeTab) {
      case "users":
        return [
          item.users_fname,
          item.users_mname,
          item.users_lname,
          item.users_school_id,
          item.users_email,
          item.departments_name,
          item.user_level_name,
        ];
      case "vehicles":
        return [
          item.vehicle_license,
          item.vehicle_make_name,
          item.vehicle_model_name,
          item.vehicle_category_name,
        ];
      case "venues":
        return [item.ven_name, item.ven_occupancy, item.ven_operating_hours];
      case "equipment":
        return [item.equip_name, item.equip_quantity];
      default:
        return [];
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleRestore = async (record) => {
    setLoading(true);
    try {
      let operation, resourceType, resourceId;
      let userType;

      switch (activeTab) {
        case "users":
          operation = "unarchiveUser";
          userType = convertUserType(record.user_level_name);
          resourceId = record.users_id;
          break;
        case "vehicles":
          operation = "unarchiveResource";
          resourceType = "vehicle";
          resourceId = record.vehicle_id;
          break;
        case "venues":
          operation = "unarchiveResource";
          resourceType = "venue";
          resourceId = record.ven_id;
          break;
        case "equipment":
          operation = "unarchiveResource";
          resourceType = "equipment";
          resourceId = record.equip_id;
          break;
        default:
          break;
      }

      const requestData =
        activeTab === "users"
          ? { operation, userType, userId: resourceId }
          : { operation, resourceType, resourceId };

      const response = await axios.post(
        `${encryptedUrl}/delete_master.php`,
        JSON.stringify(requestData),
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.status === "success") {
        toast.success(`${activeTab.slice(0, -1)} restored successfully!`);
        fetchData();
      } else {
        toast.error(`Failed to restore ${activeTab.slice(0, -1)}`);
      }
    } catch (error) {
      toast.error(
        `An error occurred while restoring ${activeTab.slice(0, -1)}`
      );
    } finally {
      setLoading(false);
    }
=======
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id"); 
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (decryptedUserLevel !== 1 && decryptedUserLevel !== 2 && decryptedUserLevel !== 4) {
        localStorage.clear();
        navigate('/gsd');
    }
  }, [navigate]);

  const handleChange = (newValue) => {
    setValue(newValue);
    setCurrentPage(1); // Reset to first page when changing tabs
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
  };

  const convertUserType = (userType) => {
    const typeMapping = {
      Dean: "dept",
      Admin: "admin",
      Driver: "driver",
      Personnel: "personel",
      User: "user",
    };
    return typeMapping[userType] || userType.toLowerCase();
  };

<<<<<<< HEAD
  const userColumns = [
    {
      title: "School ID",
      dataIndex: "users_school_id",
      key: "school_id",
      sorter: true,
      sortOrder: sortField === "users_school_id" ? sortOrder : null,
    },
    {
      title: "Name",
      key: "name",
      render: (_, record) =>
        `${record.users_fname} ${record.users_mname} ${record.users_lname}`,
      sorter: true,
      sortOrder: sortField === "name" ? sortOrder : null,
=======
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchAllUserTypes" },
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
      toast.error("An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchAllVehicles" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVehicles(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching vehicles");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchVenue" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setVenues(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching venues");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`,
        { operation: "fetchEquipmentAndInactiveUnits" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        console.log('Equipment Details:', response.data.data);
        setEquipment(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching equipment");
    } finally {
      setLoading(false);
    }
  }, [encryptedUrl]);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}/fetchMaster.php`,
        { operation: "fetchInactiveDriver" },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status === 'success') {
        setDrivers(response.data.data);
      }
    } catch (error) {
      toast.error("Error fetching drivers");
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
        fetchDrivers();
        break;
      default:
        break;
    }
  }, [value, fetchUsers, fetchVehicles, fetchVenues, fetchEquipment, fetchDrivers]);

  const handleRestoreUsers = async () => {
    const payload = {
      operation: "unarchiveUser",
      userType: "user",
      userId: selectedRowKeys
    };
    console.log('Restore Users Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} users restored successfully`);
        setSelectedRowKeys([]);
        fetchUsers();
      } else {
        message.error(`Failed to restore users`);
      }
    } catch (error) {
      console.error('Error restoring users:', error);
      message.error(`An error occurred while restoring users`);
    }
  };

  const handleRestoreVehicles = async () => {
    const payload = {
      operation: "unarchiveResource",
      resourceType: "vehicle",
      resourceId: selectedRowKeys
    };
    console.log('Restore Vehicles Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} vehicles restored successfully`);
        setSelectedRowKeys([]);
        fetchVehicles();
      } else {
        message.error(`Failed to restore vehicles`);
      }
    } catch (error) {
      console.error('Error restoring vehicles:', error);
      message.error(`An error occurred while restoring vehicles`);
    }
  };

  const handleRestoreVenues = async () => {
    const payload = {
      operation: "unarchiveResource",
      resourceType: "venue",
      resourceId: selectedRowKeys
    };
    console.log('Restore Venues Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} venues restored successfully`);
        setSelectedRowKeys([]);
        fetchVenues();
      } else {
        message.error(`Failed to restore venues`);
      }
    } catch (error) {
      console.error('Error restoring venues:', error);
      message.error(`An error occurred while restoring venues`);
    }
  };

  const handleRestoreEquipment = async (record) => {
    let resourceIds;
    if (record) {
      if (record.unit_id) {
        resourceIds = [record.unit_id];
      } else if (record.equip_id) {
        resourceIds = [record.equip_id];
      } else {
        message.error('No valid equipment ID found.');
        return;
      }
    } else {
      resourceIds = selectedRowKeys;
    }
    const payload = {
      operation: "unarchiveResource",
      resourceType: "equipment",
      resourceId: resourceIds
    };
    console.log('Restore Equipment Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);
      if (response.data.status === 'success') {
        message.success(`${resourceIds.length} equipment items restored successfully`);
        setSelectedRowKeys([]);
        fetchEquipment();
      } else {
        message.error(`Failed to restore equipment`);
      }
    } catch (error) {
      console.error('Error restoring equipment:', error);
      message.error(`An error occurred while restoring equipment`);
    }
  };

  const handleRestoreDrivers = async () => {
    const payload = {
      operation: "unarchiveUser",
      userType: "driver",
      userId: selectedRowKeys
    };
    console.log('Restore Drivers Payload:', payload);
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, payload);

      if (response.data.status === 'success') {
        message.success(`${selectedRowKeys.length} drivers restored successfully`);
        setSelectedRowKeys([]);
        fetchDrivers();
      } else {
        message.error(`Failed to restore drivers`);
      }
    } catch (error) {
      console.error('Error restoring drivers:', error);
      message.error(`An error occurred while restoring drivers`);
    }
  };

  const handleDeleteUser = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteUser",
        userId: record.users_id
      });

      if (response.data.status === 'success') {
        message.success(`User deleted successfully`);
        fetchUsers();
      } else {
        message.error(`Failed to delete user`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(`An error occurred while deleting user`);
    }
  };

  const handleDeleteVehicle = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteVehicle",
        vehicleId: record.vehicle_id
      });

      if (response.data.status === 'success') {
        message.success(`Vehicle deleted successfully`);
        fetchVehicles();
      } else {
        message.error(`Failed to delete vehicle`);
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      message.error(`An error occurred while deleting vehicle`);
    }
  };

  const handleDeleteVenue = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteVenue",
        venueId: record.ven_id
      });

      if (response.data.status === 'success') {
        message.success(`Venue deleted successfully`);
        fetchVenues();
      } else {
        message.error(`Failed to delete venue`);
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      message.error(`An error occurred while deleting venue`);
    }
  };

  const handleDeleteEquipment = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteEquipment",
        equipmentId: record.equip_id
      });

      if (response.data.status === 'success') {
        message.success(`Equipment deleted successfully`);
        fetchEquipment();
      } else {
        message.error(`Failed to delete equipment`);
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      message.error(`An error occurred while deleting equipment`);
    }
  };

  const handleDeleteDriver = async (record) => {
    try {
      const response = await axios.post(`${encryptedUrl}/delete_master.php`, {
        operation: "deleteDriver",
        driverId: record.driver_id
      });

      if (response.data.status === 'success') {
        message.success(`Driver deleted successfully`);
        fetchDrivers();
      } else {
        message.error(`Failed to delete driver`);
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      message.error(`An error occurred while deleting driver`);
    }
  };

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
        fetchDrivers();
        break;
      default:
        break;
    }
    setSearchText('');
    setCurrentPage(1);
  };

  const userColumns = [
    { 
      title: 'School ID', 
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    },
    {
      title: "Email",
      dataIndex: "users_email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Department",
      dataIndex: "departments_name",
      key: "department",
      render: (text) => (
<<<<<<< HEAD
        <Tag
          color="blue"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text}
        </Tag>
      ),
=======
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    },
    {
      title: "User Level",
      dataIndex: "user_level_name",
      key: "userLevel",
      render: (text) => (
<<<<<<< HEAD
        <Tag
          color="green"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
=======
        <Tag color="green">
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
          {text}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
<<<<<<< HEAD
        <div className="flex space-x-2">
=======
        <Space size="small">
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
          <Popconfirm
            title={`Restore this user?`}
            description="This will move the user back to active status."
<<<<<<< HEAD
            onConfirm={() => handleRestore(record)}
=======
            onConfirm={() => handleRestoreUsers(record)}
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            okText="Yes"
            cancelText="No"
            placement="left"
          >
<<<<<<< HEAD
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
=======
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this user permanently?"
            description="This will permanently delete this user and cannot be undone."
            onConfirm={() => handleDeleteUser(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            </Button>
          </Popconfirm>
        </div>
      ),
    }
  ];

  const vehicleColumns = [
<<<<<<< HEAD
    {
      title: "License",
      dataIndex: "vehicle_license",
      key: "license",
      sorter: true,
      sortOrder: sortField === "vehicle_license" ? sortOrder : null,
=======
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    },
    {
      title: "Make",
      dataIndex: "vehicle_make_name",
      key: "make",
      sorter: true,
      sortOrder: sortField === "vehicle_make_name" ? sortOrder : null,
    },
    {
      title: "Model",
      dataIndex: "vehicle_model_name",
      key: "model",
      sorter: true,
      sortOrder: sortField === "vehicle_model_name" ? sortOrder : null,
    },
    {
      title: "Category",
      dataIndex: "vehicle_category_name",
      key: "category",
      render: (text) => (
        <Tag
          color="purple"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
<<<<<<< HEAD
        <div className="flex space-x-2">
=======
        <Space size="small">
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
          <Popconfirm
            title={`Restore this vehicle?`}
            description="This will move the vehicle back to active status."
<<<<<<< HEAD
            onConfirm={() => handleRestore(record)}
=======
            onConfirm={() => handleRestoreVehicles(record)}
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            okText="Yes"
            cancelText="No"
            placement="left"
          >
<<<<<<< HEAD
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
=======
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this vehicle permanently?"
            description="This will permanently delete this vehicle and cannot be undone."
            onConfirm={() => handleDeleteVehicle(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const venueColumns = [
    {
      title: "Name",
      dataIndex: "ven_name",
      key: "name",
      sorter: true,
      sortOrder: sortField === "ven_name" ? sortOrder : null,
    },
    {
      title: "Occupancy",
      dataIndex: "ven_occupancy",
      key: "occupancy",
      sorter: true,
      sortOrder: sortField === "ven_occupancy" ? sortOrder : null,
      render: (text) => `${text} people`,
<<<<<<< HEAD
    },
    {
      title: "Operating Hours",
      dataIndex: "ven_operating_hours",
      key: "hours",
      render: (text) => (
        <Tag
          color="blue"
          className="rounded-full px-2 py-1 text-xs font-medium flex items-center justify-center"
        >
          {text}
        </Tag>
      ),
=======
      responsive: ['md'],
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
<<<<<<< HEAD
        <div className="flex space-x-2">
=======
        <Space size="small">
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
          <Popconfirm
            title={`Restore this venue?`}
            description="This will move the venue back to active status."
<<<<<<< HEAD
            onConfirm={() => handleRestore(record)}
=======
            onConfirm={() => handleRestoreVenues(record)}
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            okText="Yes"
            cancelText="No"
            placement="left"
          >
<<<<<<< HEAD
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
=======
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this venue permanently?"
            description="This will permanently delete this venue and cannot be undone."
            onConfirm={() => handleDeleteVenue(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const equipmentColumns = [
<<<<<<< HEAD
    {
      title: "Name",
      dataIndex: "equip_name",
      key: "name",
      sorter: true,
      sortOrder: sortField === "equip_name" ? sortOrder : null,
=======
    { 
      title: 'Name', 
      dataIndex: 'equip_name', 
      key: 'name',
      sorter: (a, b) => a.equip_name.localeCompare(b.equip_name),
    },
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
      render: (text) => text || 'Not Applicable',
      responsive: ['md'],
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
    },
    {
      title: "Quantity",
      dataIndex: "equip_quantity",
      key: "quantity",
      sorter: true,
      sortOrder: sortField === "equip_quantity" ? sortOrder : null,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
<<<<<<< HEAD
        <div className="flex space-x-2">
=======
        <Space size="small">
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
          <Popconfirm
            title={`Restore this equipment?`}
            description="This will move the equipment back to active status."
            onConfirm={() => handleRestore(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
<<<<<<< HEAD
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              Restore
=======
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this equipment permanently?"
            description="This will permanently delete this equipment and cannot be undone."
            onConfirm={() => handleDeleteEquipment(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  const driverColumns = [
    { 
      title: 'Employee ID', 
      dataIndex: 'employee_id', 
      key: 'employeeId',
      sorter: (a, b) => a.employee_id.localeCompare(b.employee_id),
    },
    {
      title: 'Name',
      key: 'name',
      render: (text, record) => {
        const fullName = [
          record.driver_first_name,
          record.driver_middle_name,
          record.driver_last_name,
          record.driver_suffix
        ].filter(Boolean).join(' ');
        return fullName;
      },
      sorter: (a, b) => {
        const nameA = `${a.driver_first_name} ${a.driver_last_name}`;
        const nameB = `${b.driver_first_name} ${b.driver_last_name}`;
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm
            title="Restore this driver?"
            description="This will move the driver back to active status."
            onConfirm={() => handleRestoreDrivers(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
          >
            <Button type="primary" icon={<UndoOutlined />} className="bg-green-900 hover:bg-lime-900" size="small">
              <span className="hidden sm:inline">Restore</span>
              <span className="sm:hidden">R</span>
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this driver permanently?"
            description="This will permanently delete this driver and cannot be undone."
            onConfirm={() => handleDeleteDriver(record)}
            okText="Yes"
            cancelText="No"
            placement="left"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">D</span>
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

<<<<<<< HEAD
  const getCurrentColumns = () => {
    switch (activeTab) {
      case "users":
        return userColumns;
      case "vehicles":
        return vehicleColumns;
      case "venues":
        return venueColumns;
      case "equipment":
        return equipmentColumns;
      default:
        return [];
    }
  };

  const EnhancedFilters = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-1 border-gray-400/20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Search
              placeholder={`Search ${activeTab}...`}
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip title="Refresh data">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              size="large"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-[2.5rem] lg:p-12 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-4xl font-bold text-gray-800 mt-5">
                <FileSearchOutlined className="mr-3" />
                Archive Management
=======
  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <p className="text-gray-500">No archived items found</p>
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
    { key: 4, label: 'Drivers', icon: <IdcardOutlined /> }
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
          handleRestoreDrivers();
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
          Restore Selected ({selectedRowKeys.length})
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
      value === 4 ? drivers : []
    );
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  };

  const getCurrentColumns = () => {
    switch (value) {
      case 0: return userColumns;
      case 1: return vehicleColumns;
      case 2: return venueColumns;
      case 3: return equipmentColumns;
      case 4: return driverColumns;
      default: return [];
    }
  };

  const getCurrentRowKey = () => {
    switch (value) {
      case 0: return 'users_id';
      case 1: return 'vehicle_id';
      case 2: return 'ven_id';
      case 3: return 'equip_id';
      case 4: return 'driver_id';
      default: return 'id';
    }
  };

  const getFilteredDataLength = () => {
    return getFilteredData(
      value === 0 ? users :
      value === 1 ? vehicles :
      value === 2 ? venues :
      value === 3 ? equipment :
      value === 4 ? drivers : []
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
              <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-5">
                Archive   
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
              </h2>
            </div>
          </motion.div>

<<<<<<< HEAD
          {/* Tabs */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-2 border-gray-400/20">
            <div className="flex flex-wrap gap-2">
              <Button
                type={activeTab === "users" ? "primary" : "default"}
                icon={<UserOutlined />}
                onClick={() => setActiveTab("users")}
                size="large"
              >
                Users
              </Button>
              <Button
                type={activeTab === "vehicles" ? "primary" : "default"}
                icon={<CarOutlined />}
                onClick={() => setActiveTab("vehicles")}
                size="large"
              >
                Vehicles
              </Button>
              <Button
                type={activeTab === "venues" ? "primary" : "default"}
                icon={<HomeOutlined />}
                onClick={() => setActiveTab("venues")}
                size="large"
              >
                Venues
              </Button>
              <Button
                type={activeTab === "equipment" ? "primary" : "default"}
                icon={<ToolOutlined />}
                onClick={() => setActiveTab("equipment")}
                size="large"
              >
                Equipment
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <EnhancedFilters />

          {/* Table */}
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-white dark:bg-green-100">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-green-400/90 dark:bg-green-900/20 dark:text-green-900">
                <tr>
                  {getCurrentColumns().map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-6 py-3"
                      onClick={() =>
                        column.sorter &&
                        handleSort(column.dataIndex || column.key)
                      }
                    >
                      <div className="flex items-center cursor-pointer hover:text-gray-900">
                        {column.title}
                        {sortField === (column.dataIndex || column.key) && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={
                          record[`${activeTab.slice(0, -1)}_id`] || record.id
                        }
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        {getCurrentColumns().map((column) => (
                          <td
                            key={`${record.id}-${column.key}`}
                            className="px-6 py-4"
                          >
                            {column.render
                              ? column.render(record[column.dataIndex], record)
                              : record[column.dataIndex]}
                          </td>
                        ))}
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={getCurrentColumns().length}
                      className="px-6 py-24 text-center"
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className="text-gray-500 dark:text-gray-400">
                            No archived {activeTab} found
                          </span>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Always show pagination, even when empty */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredData.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger={true}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
                className="flex justify-end"
              />
=======
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
                      className="archive-table"
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
>>>>>>> 294454d12d475aa03ab70fb2fdcf3dc49afb995f
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Archive;
