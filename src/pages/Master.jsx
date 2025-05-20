import {
  FaCar,
  FaCogs,
  FaEye,
  FaListAlt,
  FaPlus,
  FaTools,
  FaUserTie,
} from "react-icons/fa";
import React, { useCallback, useEffect, useState } from "react";
import { sanitizeInput, validateInput } from "../utils/sanitize";

import { SecureStorage } from "../utils/encryption";
import Sidebar from "./Sidebar";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
  
  const [categoryName, setCategoryName] = useState("");
  const [makeName, setMakeName] = useState("");
  const [modelName, setModelName] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
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

  const user_level_id = localStorage.getItem("user_level_id");

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
  }, [setLoading, setIsSuccess]);

  useEffect(() => {
    fetchCategoriesAndMakes();
  }, [fetchCategoriesAndMakes]);

  useEffect(() => {
    const encryptedUserLevel = SecureStorage.getSessionItem("user_level_id");
    console.log("this is encryptedUserLevel", encryptedUserLevel);
    if (
      encryptedUserLevel !== "1" &&
      encryptedUserLevel !== "2" &&
      encryptedUserLevel !== "4"
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

  const handleSaveHolidayData = async (e) => {
    e.preventDefault();
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
      const response = await axios.post(`${encryptedUrl}insert_master.php`, {
        operation: 'saveHoliday',
        data: {
          holiday_name: sanitizedHolidayName,
          holiday_date: holidayDate
        }
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

  const handleSaveDriverData = async (e) => {
    e.preventDefault();
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
      const response = await axios.post(`${encryptedUrl}insert_master.php`, {
        operation: 'saveDriver',
        data: {
          driver_first_name: sanitizeInput(driverFirstName),
          driver_middle_name: sanitizeInput(driverMiddleName),
          driver_last_name: sanitizeInput(driverLastName),
          driver_suffix: driverSuffix,
          driver_contact_number: sanitizeInput(driverContactNumber),
          driver_address: sanitizeInput(driverAddress),
          employee_id: sanitizeInput(driverEmployeeId),
          driver_birthdate: driverBirthdate,
          user_admin_id: SecureStorage.getSessionItem('user_id')
        }
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
    setEquipmentName("");
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
    setIsAddEquipmentModalOpen(false);
    setIsAddUserLevelModalOpen(false);
    setIsAddDepartmentModalOpen(false);
    setIsAddConditionModalOpen(false);
    setIsAddHolidayModalOpen(false);
    setIsAddDriverModalOpen(false);
  };

  const handleSaveCategoryData = (e) => {
    e.preventDefault();
    handleSaveData("saveCategoryData", { vehicle_category_name: categoryName });
  };

  const handleSaveMakeData = (e) => {
    e.preventDefault();
    handleSaveData("saveMakeData", { vehicle_make_name: makeName });
  };

  const handleSaveModelData = (e) => {
    e.preventDefault();
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

  const handleSaveEquipmentData = (e) => {
    e.preventDefault();
    handleSaveData("saveEquipmentCategory", {
      equipments_category_name: equipmentName,
    });
  };

  const handleSaveUserLevelData = (e) => {
    e.preventDefault();
    handleSaveData("saveUserLevelData", {
      user_level_name: userLevelName,
      user_level_desc: userLevelDesc,
    });
  };

  const handleSaveDepartmentData = async (e) => {
    e.preventDefault();
    handleSaveData("saveDepartmentData", { departments_name: departmentName });
  };

  const handleSaveConditionData = (e) => {
    e.preventDefault();
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
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-green-100 to-white">
      <Sidebar />
      <div className="flex-grow  overflow-y-auto mt-20">
        <div className="flex-grow p-6 sm:p-8 overflow-y-auto">
          {/* Masters Header */}
          <div className="bg-[#fafff4] p-4 border rounded-lg shadow-md mb-6 mt-[5rem] md:mt-0 w-full">
            <motion.h1
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-custom-font font-bold text-green-900"
            >
              Masters
            </motion.h1>
          </div>
          {/* Responsive Grid for Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Vehicle Category",
                icon: <FaCar />,
                action: () => setIsAddCategoryModalOpen(true),
                viewPath: "/vehicleCategory",
              },
              {
                title: "Vehicle Make",
                icon: <FaTools />,
                action: () => setIsAddMakeModalOpen(true),
                viewPath: "/vehiclemake",
              },
              {
                title: "Vehicle Model",
                icon: <FaCogs />,
                action: () => setIsAddModelModalOpen(true),
                viewPath: "/vehiclemodel",
              },
              {
                title: "Departments",
                icon: <FaListAlt />,
                action: () => setIsAddDepartmentModalOpen(true),
                viewPath: "/departments",
              },
              {
                title: "Equipments",
                icon: <FaListAlt />,
                action: () => setIsAddEquipmentModalOpen(true),
                viewPath: "/equipmentCat",
              },
              // {
              //   title: "Condition",
              //   icon: <FaCogs />,
              //   action: () => setIsAddConditionModalOpen(true),
              //   viewPath: "/condition",
              // },
              {
                title: "Holidays", 
                icon: <FaPlus />, 
                action: () => setIsAddHolidayModalOpen(true),
                viewPath: "/holidays",
              },
              {
                title: "Drivers",
                icon: <FaUserTie />,
                action: () => setIsAddDriverModalOpen(true),
                viewPath: "/drivers",
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
                      className="w-10 h-10 flex items-center justify-center bg-lime-900 text-white rounded-full hover:bg-green-600 transition duration-300"
                    >
                      <FaPlus className="text-sm" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate(card.viewPath)}
                      className="w-10 h-10 flex items-center justify-center bg-green-900 text-white rounded-full hover:bg-lime-900 transition duration-300"
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
                      className="flex-1 py-2 bg-lime-900 text-white rounded-full hover:bg-green-600 transition duration-300 text-sm"
                    >
                      <FaPlus className="mx-auto" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => navigate(card.viewPath)}
                      className="flex-1 py-2 bg-green-900 text-white rounded-full hover:bg-lime-900 transition duration-300 text-sm"
                    >
                      <FaEye className="mx-auto" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
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
        {isAddEquipmentModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Equipment Category</h2>
              <form onSubmit={handleSaveEquipmentData}>
                <input
                  type="text"
                  value={equipmentName}
                  onChange={handleInputChange(setEquipmentName)}
                  placeholder="Enter equipment name"
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
        {isAddHolidayModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Add Holiday</h2>
              <form onSubmit={handleSaveHolidayData}>
                <input
                  type="text"
                  value={holidayName}
                  onChange={handleInputChange(setHolidayName)}
                  placeholder="Enter holiday name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <input                  type="date"                  value={holidayDate}                  onChange={(e) => setHolidayDate(e.target.value)}                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"                />
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

        {/* Modal for Adding Driver */}
        {isAddDriverModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Add Driver</h2>
              <form onSubmit={handleSaveDriverData}>
                <input
                  type="text"
                  value={driverFirstName}
                  onChange={handleInputChange(setDriverFirstName)}
                  placeholder="Enter first name *"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                  required
                />
                <input
                  type="text"
                  value={driverMiddleName}
                  onChange={handleInputChange(setDriverMiddleName)}
                  placeholder="Enter middle name"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <input
                  type="text"
                  value={driverLastName}
                  onChange={handleInputChange(setDriverLastName)}
                  placeholder="Enter last name *"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                  required
                />
                <select
                  value={driverSuffix}
                  onChange={(e) => setDriverSuffix(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                >
                  <option value="">Select Suffix</option>
                  <option value="Jr">Jr</option>
                  <option value="Sr">Sr</option>
                  <option value="I">I</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
                <input
                  type="tel"
                  value={driverContactNumber}
                  onChange={handleInputChange(setDriverContactNumber)}
                  placeholder="Enter contact number *"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                  required
                />
                <textarea
                  value={driverAddress}
                  onChange={handleInputChange(setDriverAddress)}
                  placeholder="Enter address *"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                  required
                />
                <input
                  type="text"
                  value={driverEmployeeId}
                  onChange={handleInputChange(setDriverEmployeeId)}
                  placeholder="Enter employee ID"
                  className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
                />
                <input
                  type="date"
                  value={driverBirthdate}
                  onChange={handleInputChange(setDriverBirthdate)}
                  placeholder="Enter birthdate"
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

        {popupMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg"
          >
            {popupMessage}
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg"
          >
            {message}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Master;