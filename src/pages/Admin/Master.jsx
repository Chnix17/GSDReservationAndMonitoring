import {
  FaCar,
  FaEye,
  FaListAlt,
  FaPlus,
  FaUserTie,
  FaBuilding,
  FaUsers,
} from "react-icons/fa";
import React, { useCallback, useEffect, useState } from "react";
import { sanitizeInput, validateInput } from "../../utils/sanitize";
import MasterEquipmentModal from "./lib/Equipment/Master_Modal";
import CreateVehicleModal from "./lib/Vehicle/Create_Modal";
import CreateVenueModal from "./lib/Venue/Create_Modal";
import CreateModal from "./lib/Faculty/Create_Modal";

import { SecureStorage } from "../../utils/encryption";
import Sidebar from "../Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Modal, Form, Input, Select, Button, DatePicker } from 'antd';
import dayjs from 'dayjs';

const Master = () => {
  const navigate = useNavigate();
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddMakeModalOpen, setIsAddMakeModalOpen] = useState(false);
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [isAddUserLevelModalOpen, setIsAddUserLevelModalOpen] = useState(false);
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] =
    useState(false);
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
  const [categoryName, setCategoryName] = useState("");
  const [makeName, setMakeName] = useState("");
  const [modelName, setModelName] = useState("");
  const [userLevelName, setUserLevelName] = useState("");
  const [userLevelDesc, setUserLevelDesc] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [conditionName, setConditionName] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [driverFirstName, setDriverFirstName] = useState("");
  const [driverMiddleName, setDriverMiddleName] = useState("");
  const [driverLastName, setDriverLastName] = useState("");
  const [driverSuffix, setDriverSuffix] = useState("");
  const [driverContactNumber, setDriverContactNumber] = useState("");
  const [driverAddress, setDriverAddress] = useState("");
  const [driverEmployeeId, setDriverEmployeeId] = useState("");
  const [driverBirthdate, setDriverBirthdate] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [categories, setCategories] = useState([]);
  const [makes, setMakes] = useState([]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const encryptedUrl = SecureStorage.getLocalItem("url");

  const [statusOptions, setStatusOptions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [userLevels, setUserLevels] = useState([]);


  const fetchCategoriesAndMakes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${encryptedUrl}vehicle_master.php`, {
        operation: "fetchCategoriesAndMakes",
      });
      const data = response.data;

      if (data.status === "success") {
        setCategories(data.categories);
        setMakes(data.makes);
      } else {
        setMessage(`Error fetching data: ${data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Error fetching data.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setIsSuccess, encryptedUrl]);



  const fetchStatusOptions = useCallback(async () => {
    try {
      const response = await axios.post(`${encryptedUrl}vehicle_master.php`, {
        operation: "fetchStatusOptions",
      });
      if (response.data.status === "success") {
        setStatusOptions(response.data.options);
      }
    } catch (error) {
      console.error("Error fetching status options:", error);
    }
  }, [encryptedUrl]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.post(`${encryptedUrl}vehicle_master.php`, {
        operation: "fetchDepartments",
      });
      if (response.data.status === "success") {
        setDepartments(response.data.departments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, [encryptedUrl]);

  const fetchUserLevels = useCallback(async () => {
    try {
      const response = await axios.post(`${encryptedUrl}vehicle_master.php`, {
        operation: "fetchUserLevels",
      });
      if (response.data.status === "success") {
        setUserLevels(response.data.userLevels);
      }
    } catch (error) {
      console.error("Error fetching user levels:", error);
    }
  }, [encryptedUrl]);

  useEffect(() => {
    fetchCategoriesAndMakes();
    fetchStatusOptions();
    fetchDepartments();
    fetchUserLevels();
  }, [fetchCategoriesAndMakes, fetchStatusOptions, fetchDepartments, fetchUserLevels]);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");
    const decryptedUserLevel = parseInt(encryptedUserLevel);
    if (
      decryptedUserLevel !== 1 &&
      decryptedUserLevel !== 2 &&
      decryptedUserLevel !== 4
    ) {
      localStorage.clear();
      navigate("/gsd");
    }
  }, [navigate]);

  const handleSaveData = async (operation, data) => {
    const isValid = Object.values(data).every((value) => validateInput(value));
    if (!isValid) {
      setMessage("Invalid input detected");
      setIsSuccess(false);
      return;
    }

    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sanitizeInput(value)])
    );

    try {
      const response = await axios.post(`${encryptedUrl}vehicle_master.php`, {
        operation,
        json: JSON.stringify(sanitizedData),
      });

      if (response.data.status === "success") {
        const name =
          operation === "saveCategoryData"
            ? "Category"
            : operation === "saveMakeData"
            ? "Make"
            : operation === "saveModelData"
            ? "Model"
            : operation === "saveEquipmentCategory"
            ? "Equipment"
            : operation === "saveUserLevelData"
            ? "User Level"
            : operation === "saveDepartmentData"
            ? "Department"
            : operation === "saveConditionData"
            ? "Condition"
            : "Position";

        setMessage(`${name} added successfully!`);
        setIsSuccess(true);
        setPopupMessage(`Successfully added ${name}!`);
        fetchCategoriesAndMakes();
        clearInputs(); // Only clear inputs, don't close modal

        setTimeout(() => {
          setPopupMessage("");
        }, 3000);
      } else {
        setMessage(`Error: ${response.data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error(`Error adding ${operation}:`, error);
      setMessage(`Error adding ${operation}.`);
      setIsSuccess(false);
    }
  };

  const handleSaveHolidayData = async (values) => {
    // Check if values is an event object (from regular form) or form values (from Ant Design Form)
    if (values && values.preventDefault) {
      values.preventDefault();
    }
    
    if (!holidayName.trim() || !holidayDate) {
      setMessage('Holiday name and date are required.');
      setIsSuccess(false);
      return;
    }

    const isValid = validateInput(holidayName);
    if (!isValid) {
      setMessage('Invalid input detected');
      setIsSuccess(false);
      return;
    }

    const sanitizedHolidayName = sanitizeInput(holidayName);

    try {
      const response = await axios.post(`${encryptedUrl}user.php`, {
        operation: 'saveHoliday',
        holiday_name: sanitizedHolidayName,
        holiday_date: holidayDate
      });

      if (response.data.status === 'success') {
        setMessage('Holiday added successfully!');
        setIsSuccess(true);
        setPopupMessage('Successfully added Holiday!');
        clearInputs();
        setTimeout(() => {
          setPopupMessage('');
        }, 3000);
      } else {
        setMessage(`Error: ${response.data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error adding holiday:', error);
      setMessage('Error adding holiday.');
      setIsSuccess(false);
    }
  };

  const handleSaveDriverData = async (values) => {
    // Check if values is an event object (from regular form) or form values (from Ant Design Form)
    if (values && values.preventDefault) {
      values.preventDefault();
    }
    
    if (!driverFirstName.trim() || !driverLastName.trim() || !driverContactNumber.trim() || !driverAddress.trim() || !driverEmployeeId.trim() || !driverBirthdate) {
      setMessage('Required fields cannot be empty');
      setIsSuccess(false);
      return;
    }

    const isValid = validateInput(driverFirstName) && validateInput(driverLastName) && 
                   validateInput(driverMiddleName) && validateInput(driverAddress) && validateInput(driverEmployeeId);
    if (!isValid) {
      setMessage('Invalid input detected');
      setIsSuccess(false);
      return;
    }

    try {
      const response = await axios.post(`${encryptedUrl}user.php`, {
        operation: 'saveDriver',
        driver_first_name: sanitizeInput(driverFirstName),
        driver_middle_name: sanitizeInput(driverMiddleName),
        driver_last_name: sanitizeInput(driverLastName),
        driver_suffix: driverSuffix,
        driver_contact_number: sanitizeInput(driverContactNumber),
        driver_address: sanitizeInput(driverAddress),
        employee_id: sanitizeInput(driverEmployeeId),
        driver_birthdate: driverBirthdate,
        user_admin_id: SecureStorage.getSessionItem('user_id')
      });

      if (response.data.status === 'success') {
        setMessage('Driver added successfully!');
        setIsSuccess(true);
        setPopupMessage('Successfully added Driver!');
        clearInputs();
        setTimeout(() => {
          setPopupMessage('');
        }, 3000);
      } else {
        setMessage(`Error: ${response.data.message}`);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error adding driver:', error);
      setMessage('Error adding driver.');
      setIsSuccess(false);
    }
  };

  const clearInputs = () => {
    setCategoryName("");
    setMakeName("");
    setModelName("");
    setUserLevelName("");
    setUserLevelDesc("");
    setDepartmentName("");
    setConditionName("");
    setHolidayName("");
    setHolidayDate("");
    setDriverFirstName("");
    setDriverMiddleName("");
    setDriverLastName("");
    setDriverSuffix("");
    setDriverContactNumber("");
    setDriverAddress("");
    setDriverEmployeeId("");
    setDriverBirthdate("");
    setSelectedCategory("");
    setSelectedMake("");
    setMessage("");
  };

  const resetForm = () => {
    clearInputs();
    setIsAddCategoryModalOpen(false);
    setIsAddMakeModalOpen(false);
    setIsAddModelModalOpen(false);
    setIsAddUserLevelModalOpen(false);
    setIsAddDepartmentModalOpen(false);
    setIsAddConditionModalOpen(false);
    setIsAddHolidayModalOpen(false);
    setIsAddDriverModalOpen(false);
    setIsAddVehicleModalOpen(false);
    setIsAddVenueModalOpen(false);
    setIsAddUserModalOpen(false);
  };

  const handleSaveCategoryData = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    handleSaveData("saveCategoryData", { vehicle_category_name: categoryName });
  };

  const handleSaveMakeData = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    handleSaveData("saveMakeData", { vehicle_make_name: makeName });
  };

  const handleSaveModelData = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!selectedCategory || !selectedMake) {
      setMessage("Please select both a category and a make.");
      setIsSuccess(false);
      return;
    }
    handleSaveData("saveModelData", {
      name: modelName,
      category_id: selectedCategory,
      make_id: selectedMake,
    });
  };



  const handleSaveUserLevelData = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    handleSaveData("saveUserLevelData", {
      user_level_name: userLevelName,
      user_level_desc: userLevelDesc,
    });
  };

  const handleSaveDepartmentData = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    handleSaveData("saveDepartmentData", { departments_name: departmentName });
  };

  const handleSaveConditionData = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!conditionName.trim()) {
      setMessage("Condition name is required.");
      setIsSuccess(false);
      return;
    }
    handleSaveData("saveConditionData", {
      condition_name: conditionName.trim(),
    });
  };

  const handleInputChange = (setter) => (e) => {
    const sanitizedValue = sanitizeInput(e.target.value);
    setter(sanitizedValue);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-green-100 to-white">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
        {/* Masters Header */}
        <div className="bg-[#fafff4] p-4 border rounded-lg shadow-md mb-6 mt-20 w-full">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-custom-font font-bold text-green-900"
          >
            Master File
          </motion.h1>
        </div>
        {/* Responsive Grid for Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Vehicles",
              icon: <FaCar />,
              action: () => setIsAddVehicleModalOpen(true),
              viewPath: "/VehicleEntry",
            },
            {
              title: "Equipments",
              icon: <FaListAlt />,
              action: () => setIsAddEquipmentModalOpen(true),
              viewPath: "/Equipment",
            },
            {
              title: "Holidays", 
              icon: <FaPlus />, 
              action: () => setIsAddHolidayModalOpen(true),
              viewPath: "/Holiday",
            },
            // {
            //   title: "Drivers",
            //   icon: <FaUserTie />,
            //   action: () => setIsAddDriverModalOpen(true),
            //   viewPath: "/drivers",
            // },
            {
              title: "Venues",
              icon: <FaBuilding />,
              action: () => setIsAddVenueModalOpen(true),
              viewPath: "/Venue",
            },
            {
              title: "Users",
              icon: <FaUsers />,
              action: () => setIsAddUserModalOpen(true),
              viewPath: "/Faculty",
            },
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-[#fafff4] rounded-2xl shadow-md overflow-hidden w-full flex items-center justify-between p-4 md:block md:flex-none md:items-start md:justify-normal md:p-0"
            >
              {/* Mobile View (simple list item) */}
              <div className="md:hidden flex items-center gap-4 w-full">
                <div className="text-green-900 text-2xl">{card.icon}</div>
                <h3 className="text-lg font-semibold text-green-950 flex-grow">
                  {card.title}
                </h3>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      card.action();
                      setMessage("");
                    }}
                    disabled={loading}
                    className={`w-10 h-10 flex items-center justify-center bg-lime-900 text-white rounded-full hover:bg-green-600 transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? <span className="animate-spin">⌛</span> : <FaPlus className="text-sm" />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(card.viewPath)}
                    disabled={loading}
                    className={`w-10 h-10 flex items-center justify-center bg-green-900 text-white rounded-full hover:bg-lime-900 transition duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FaEye className="text-sm" />
                  </motion.button>
                </div>
              </div>

              {/* Desktop View (card) */}
              <div className="hidden md:block ">
                <div className="pb-6 border-b border-green-900/20">
                  <div className="text-green-900 text-3xl mb-2">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-green-950">
                    {card.title}
                  </h3>
                </div>
                <div className="pr-4 pt-4 flex justify-between items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      card.action();
                      setMessage("");
                    }}
                    disabled={loading}
                    className={`flex-1 py-2 bg-lime-900 text-white rounded-full hover:bg-green-600 transition duration-300 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? <span className="animate-spin">⌛</span> : <FaPlus className="mx-auto" />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate(card.viewPath)}
                    disabled={loading}
                    className={`flex-1 py-2 bg-green-900 text-white rounded-full hover:bg-lime-900 transition duration-300 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FaEye className="mx-auto" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal for Adding Category */}
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Vehicle Category</h2>
              <form onSubmit={handleSaveCategoryData}>
                <input
                  type="text"
                  value={categoryName}
                  onChange={handleInputChange(setCategoryName)}
                  placeholder="Enter category name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-2 py-2 px-4 bg-gray-500 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Make */}
        {isAddMakeModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Vehicle Make</h2>
              <form onSubmit={handleSaveMakeData}>
                <input
                  type="text"
                  value={makeName}
                  onChange={handleInputChange(setMakeName)}
                  placeholder="Enter make name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-2 py-2 px-4 bg-gray-500 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Model */}
        {isAddModelModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Vehicle Model</h2>
              <form onSubmit={handleSaveModelData}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option
                      key={category.vehicle_category_id}
                      value={category.vehicle_category_id}
                    >
                      {category.vehicle_category_name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                >
                  <option value="">Select Make</option>
                  {makes.map((make) => (
                    <option
                      key={make.vehicle_make_id}
                      value={make.vehicle_make_id}
                    >
                      {make.vehicle_make_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={modelName}
                  onChange={handleInputChange(setModelName)}
                  placeholder="Enter model name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-2 py-2 px-4 bg-gray-500 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Equipment */}
        <MasterEquipmentModal
          isOpen={isAddEquipmentModalOpen}
          onClose={() => setIsAddEquipmentModalOpen(false)}
          onSuccess={() => {

            setPopupMessage("Equipment added successfully!");
            setTimeout(() => {
              setPopupMessage("");
            }, 3000);
          }}
        />

        {/* Modal for Adding User Level */}
        {isAddUserLevelModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add User Level</h2>
              <form onSubmit={handleSaveUserLevelData}>
                <input
                  type="text"
                  value={userLevelName}
                  onChange={handleInputChange(setUserLevelName)}
                  placeholder="Enter user level name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <textarea
                  value={userLevelDesc}
                  onChange={handleInputChange(setUserLevelDesc)}
                  placeholder="Enter user level description"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-2 py-2 px-4 bg-gray-500 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Department */}
        {isAddDepartmentModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Department</h2>
              <form onSubmit={handleSaveDepartmentData}>
                <input
                  type="text"
                  value={departmentName}
                  onChange={handleInputChange(setDepartmentName)}
                  placeholder="Enter department name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-2 py-2 px-4 bg-gray-500 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Condition */}
        {isAddConditionModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Condition</h2>
              <form onSubmit={handleSaveConditionData}>
                <input
                  type="text"
                  value={conditionName}
                  onChange={handleInputChange(setConditionName)}
                  placeholder="Enter condition name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-2 py-2 px-4 bg-gray-500 text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Adding Holiday */}
        <Modal
            title={
                <div className="flex items-center">
                    <FaPlus className="mr-2 text-green-900" />
                    Add New Holiday
                </div>
            }
            open={isAddHolidayModalOpen}
            onCancel={resetForm}
            footer={null}
            width={600}
        >
            <Form
                layout="vertical"
                onFinish={handleSaveHolidayData}
                className="p-4"
            >
                <Form.Item
                    label="Holiday Name"
                    name="holiday_name"
                    rules={[
                        { required: true, message: 'Please input holiday name!' },
                        { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                    ]}
                >
                    <Input 
                        value={holidayName}
                        onChange={handleInputChange(setHolidayName)}
                        placeholder="Enter holiday name"
                    />
                </Form.Item>

                <Form.Item
                    label="Holiday Date"
                    name="holiday_date"
                    rules={[
                        { required: true, message: 'Please select holiday date!' }
                    ]}
                >
                    <DatePicker
                        value={holidayDate ? dayjs(holidayDate) : null}
                        onChange={(date) => setHolidayDate(date ? date.format('YYYY-MM-DD') : '')}
                        className="w-full"
                    />
                </Form.Item>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={resetForm}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        className="bg-green-900 hover:bg-lime-900"
                    >
                        Add Holiday
                    </Button>
                </div>
            </Form>
        </Modal>

        {/* Modal for Adding Driver */}
        <Modal
            title={
                <div className="flex items-center">
                    <FaUserTie className="mr-2 text-green-900" />
                    Add New Driver
                </div>
            }
            open={isAddDriverModalOpen}
            onCancel={resetForm}
            footer={null}
            width={800}
        >
            <Form
                layout="vertical"
                onFinish={handleSaveDriverData}
                className="p-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                        label="First Name"
                        name="driver_firstname"
                        rules={[
                            { required: true, message: 'Please input first name!' },
                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                        ]}
                    >
                        <Input 
                            value={driverFirstName}
                            onChange={handleInputChange(setDriverFirstName)}
                            placeholder="Enter first name"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Middle Name"
                        name="driver_middlename"
                        rules={[
                            { pattern: /^[a-zA-Z\s]*$/, message: 'Name can only contain letters and spaces' }
                        ]}
                    >
                        <Input 
                            value={driverMiddleName}
                            onChange={handleInputChange(setDriverMiddleName)}
                            placeholder="Enter middle name"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Last Name"
                        name="driver_lastname"
                        rules={[
                            { required: true, message: 'Please input last name!' },
                            { pattern: /^[a-zA-Z\s]+$/, message: 'Name can only contain letters and spaces' }
                        ]}
                    >
                        <Input 
                            value={driverLastName}
                            onChange={handleInputChange(setDriverLastName)}
                            placeholder="Enter last name"
                        />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label="Suffix"
                        name="driver_suffix"
                    >
                        <Select
                            value={driverSuffix}
                            onChange={(value) => setDriverSuffix(value)}
                            placeholder="Select suffix"
                        >
                            <Select.Option value="">None</Select.Option>
                            <Select.Option value="Jr.">Jr.</Select.Option>
                            <Select.Option value="Sr.">Sr.</Select.Option>
                            <Select.Option value="II">II</Select.Option>
                            <Select.Option value="III">III</Select.Option>
                            <Select.Option value="IV">IV</Select.Option>
                            <Select.Option value="V">V</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Birthday"
                        name="driver_birthday"
                        rules={[
                            { required: true, message: 'Please select birthday!' },
                            { validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                const birthDate = new Date(value);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                }
                                return age >= 18 && age <= 100 ? Promise.resolve() : Promise.reject('Age must be between 18 and 100');
                            }}
                        ]}
                    >
                        <DatePicker
                            value={driverBirthdate ? dayjs(driverBirthdate) : null}
                            onChange={(date) => setDriverBirthdate(date ? date.format('YYYY-MM-DD') : '')}
                            className="w-full"
                            maxDate={dayjs()}
                        />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        label="Contact Number"
                        name="driver_contact"
                        rules={[
                            { required: true, message: 'Please input contact number!' },
                            { pattern: /^\d{11}$/, message: 'Contact number must be 11 digits' }
                        ]}
                    >
                        <Input 
                            value={driverContactNumber}
                            onChange={handleInputChange(setDriverContactNumber)}
                            placeholder="Enter contact number"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Employee ID"
                        name="driver_employee_id"
                        rules={[
                            { required: true, message: 'Please input employee ID!' }
                        ]}
                    >
                        <Input 
                            value={driverEmployeeId}
                            onChange={handleInputChange(setDriverEmployeeId)}
                            placeholder="Enter employee ID"
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    label="Address"
                    name="driver_address"
                    rules={[
                        { required: true, message: 'Please input address!' }
                    ]}
                >
                    <Input.TextArea 
                        value={driverAddress}
                        onChange={handleInputChange(setDriverAddress)}
                        placeholder="Enter address"
                        rows={4}
                    />
                </Form.Item>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={resetForm}>
                        Cancel
                    </Button>
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        className="bg-green-900 hover:bg-lime-900"
                    >
                        Add Driver
                    </Button>
                </div>
            </Form>
        </Modal>

        {/* Modal for Adding Vehicle */}
        <CreateVehicleModal
          open={isAddVehicleModalOpen}
          onCancel={() => setIsAddVehicleModalOpen(false)}
          onSubmit={() => {
            setPopupMessage("Vehicle added successfully!");
            setTimeout(() => {
              setPopupMessage("");
            }, 3000);
          }}
          IMAGE_BASE_URL="http://localhost/coc/gsd/uploads/"
        />

        {/* Modal for Adding Venue */}
        <CreateVenueModal
          visible={isAddVenueModalOpen}
          onCancel={() => setIsAddVenueModalOpen(false)}
          onSuccess={() => {
            setPopupMessage("Venue added successfully!");
            setTimeout(() => {
              setPopupMessage("");
            }, 3000);
          }}
          statusOptions={statusOptions}
          encryptedUrl={encryptedUrl}
          user_id={SecureStorage.getSessionItem('user_id')}
          encryptedUserLevel={SecureStorage.getSessionItem('user_level_id')}
        />

        {/* Modal for Adding User */}
        <CreateModal
          show={isAddUserModalOpen}
          onHide={() => setIsAddUserModalOpen(false)}
          departments={departments}
          userLevels={userLevels}
          onSubmit={async (jsonData) => {
            try {
              const response = await axios.post(`${encryptedUrl}user.php`, jsonData);
              if (response.data.status === 'success') {
                setPopupMessage("User added successfully!");
                setTimeout(() => {
                  setPopupMessage("");
                }, 3000);
              }
              return response;
            } catch (error) {
              console.error('Error adding user:', error);
              throw error;
            }
          }}
          fetchUsers={() => {
            // Add fetch users logic here if needed
          }}
        />

        {popupMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 text-white p-4 rounded-lg shadow-lg ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {popupMessage}
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 text-white p-4 rounded-lg shadow-lg ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}
          >
            {message}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Master;