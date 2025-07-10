import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaCheck, FaTimes } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { SecureStorage } from '../utils/encryption';

const ForcePassword = ({ onPasswordChanged, currentPassword }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    const checkPasswordStrength = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    };

    const handleNewPasswordChange = (e) => {
        const password = e.target.value;
        setNewPassword(password);
        setPasswordStrength(checkPasswordStrength(password));
    };

    const isPasswordValid = () => {
        return Object.values(passwordStrength).every(value => value === true);
    };

    const isPasswordDifferent = () => {
        return newPassword !== currentPassword;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isPasswordValid()) {
            toast.error("Please ensure password meets all requirements");
            return;
        }

        if (!isPasswordDifferent()) {
            toast.error("New password must be different from the current password");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const apiUrl = SecureStorage.getLocalItem("url");
            const userId = SecureStorage.getSessionItem("temp_user_id");
            
            // First, change the password
            const response = await axios.post(`${apiUrl}user.php`, {
                operation: "updatePassword",
                userId: userId,
                oldPassword: currentPassword,
                newPassword: newPassword
            });

            if (response.data.status === "success") {
                // Now update firstLogin status
                try {
                    const updateFirstLoginRes = await axios.post(`${apiUrl}login.php`, {
                        operation: "updateFirstLogin",
                        json: {
                            users_id: userId
                        }
                    });
                    if (updateFirstLoginRes.data.status === "success") {
                        toast.success("Password changed successfully!");
                        onPasswordChanged();
                    } else {
                        toast.error(updateFirstLoginRes.data.message || "Failed to update first login status");
                    }
                } catch (err) {
                    toast.error("Error updating first login status. Please try again.");
                }
            } else {
                toast.error(response.data.message || "Failed to change password");
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error("Error changing password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-accent-light flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                                <FaLock className="h-8 w-8 text-amber-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Change Your Password</h2>
                            <p className="text-gray-500 mt-2">For security reasons, you must change your default password</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">New Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FaLock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={handleNewPasswordChange}
                                        className="block w-full pl-12 pr-12 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out"
                                        placeholder="Create a strong password"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-500 transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                                    </button>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                <div className="mt-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={`flex items-center p-2 rounded-lg ${passwordStrength.length ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                            <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.length ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                {passwordStrength.length ? <FaCheck className="w-3 h-3 text-white" /> : <FaTimes className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs">8+ characters</span>
                                        </div>
                                        <div className={`flex items-center p-2 rounded-lg ${passwordStrength.uppercase ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                            <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.uppercase ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                {passwordStrength.uppercase ? <FaCheck className="w-3 h-3 text-white" /> : <FaTimes className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs">Uppercase</span>
                                        </div>
                                        <div className={`flex items-center p-2 rounded-lg ${passwordStrength.lowercase ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                            <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.lowercase ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                {passwordStrength.lowercase ? <FaCheck className="w-3 h-3 text-white" /> : <FaTimes className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs">Lowercase</span>
                                        </div>
                                        <div className={`flex items-center p-2 rounded-lg ${passwordStrength.number ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                            <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.number ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                {passwordStrength.number ? <FaCheck className="w-3 h-3 text-white" /> : <FaTimes className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-xs">Number</span>
                                        </div>
                                    </div>
                                    <div className={`flex items-center p-2 rounded-lg ${passwordStrength.special ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                        <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.special ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                            {passwordStrength.special ? <FaCheck className="w-3 h-3 text-white" /> : <FaTimes className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-xs">Special character (!@#$%^&*)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FaLock className="text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`block w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border ${
                                            newPassword !== confirmPassword && confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                        } rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out`}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                                {newPassword !== confirmPassword && confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <FaTimes className="h-4 w-4 mr-1" />
                                        Passwords do not match
                                    </p>
                                )}
                            </div>
                            
                            <button
                                onClick={handleSubmit}
                                disabled={!isPasswordValid() || newPassword !== confirmPassword || !isPasswordDifferent() || loading}
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-lg shadow-amber-500/30 transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Changing Password...
                                    </>
                                ) : (
                                    "Change Password"
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
            
            <Toaster 
                position="top-right" 
                reverseOrder={false}
                toastOptions={{
                    style: {
                        borderRadius: '10px',
                        padding: '16px',
                        color: '#333',
                    },
                    success: {
                        style: {
                            background: '#f0fdf4',
                            border: '1px solid #dcfce7',
                            color: '#166534',
                        },
                        iconTheme: {
                            primary: '#16a34a',
                            secondary: '#ffffff',
                        },
                    },
                    error: {
                        style: {
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            color: '#b91c1c',
                        },
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                        },
                    },
                }}
            />
        </div>
    );
};

export default ForcePassword;
