import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, useAnimation } from 'framer-motion';
import { FaEye, FaEyeSlash, FaLock, FaUser} from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { Modal } from 'antd';
import { setSessionCookie, removeSessionCookie, refreshSessionCookie } from '../utils/cookieUtils';
import { initializeSessionManager, updateLastActivity } from '../utils/sessionManager';
import { SecureStorage } from '../utils/encryption';

function Logins() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCaptchaCorrect, setIsCaptchaCorrect] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigateTo = useNavigate();
    const controls = useAnimation();
    const [captchaText, setCaptchaText] = useState('');
    const [userCaptchaInput, setUserCaptchaInput] = useState('');
    const [captchaCanvasRef] = useState(React.createRef());
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [setIsEmailValid] = useState(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [setResetKey] = useState('');
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [canResendLoginOtp, setCanResendLoginOtp] = useState(false);

    const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
    const [otpRefs] = useState(Array(6).fill(0).map(() => React.createRef()));
    const [showCaptchaAfterEmail, setShowCaptchaAfterEmail] = useState(false);
    const [forgotPasswordCaptchaRef] = useState(React.createRef());
    const [forgotPasswordCaptchaText, setForgotPasswordCaptchaText] = useState('');
    const [forgotPasswordCaptchaInput, setForgotPasswordCaptchaInput] = useState('');
    const [isForgotPasswordCaptchaCorrect, setIsForgotPasswordCaptchaCorrect] = useState(null);
    const [canResendOtp, setCanResendOtp] = useState(false);
    const [resendTimer, setResendTimer] = useState(180); // 3 minutes in seconds
    const [isResending, setIsResending] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });
    const [showLoginOTP, setShowLoginOTP] = useState(false);
    const [loginOtpDigits, setLoginOtpDigits] = useState(Array(6).fill(''));
    const [loginOtpRefs] = useState(Array(6).fill(0).map(() => React.createRef()));
    const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
    const [loginResendTimer, setLoginResendTimer] = useState(180); // 3 minutes
    const [isResendingLoginOtp, setIsResendingLoginOtp] = useState(false);
    const [lastTimerUpdate, setLastTimerUpdate] = useState(Date.now());

    const generateCaptcha = useCallback(() => {
        const canvas = captchaCanvasRef.current;
        if (!canvas) return; 

        const ctx = canvas.getContext('2d');
        if (!ctx) return; 
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let captcha = '';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0fdf4');
        gradient.addColorStop(1, '#dcfce7');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set fixed font properties
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate character spacing
        const charWidth = canvas.width / 8;
        const startX = charWidth;
        const centerY = canvas.height / 2;

        // Generate and draw characters
        for (let i = 0; i < 6; i++) {
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            captcha += char;
            
            // Slightly randomize color for each character
            const hue = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsl(${hue}, 50%, 30%)`; // Using HSL for better contrast

            // Draw character at fixed position with slight vertical variation
            const x = startX + (i * charWidth);
            const y = centerY + (Math.random() * 6 - 3); // Small vertical variation (-3 to +3 pixels)
            ctx.fillText(char, x, y);
        }

        // Add subtle noise/lines in background (optional)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, 0);
            ctx.lineTo(Math.random() * canvas.width, canvas.height);
            ctx.stroke();
        }

        setCaptchaText(captcha);
        setUserCaptchaInput('');
        setIsCaptchaCorrect(null);
    }, [captchaCanvasRef]);

    const generateForgotPasswordCaptcha = useCallback(() => {
        const canvas = forgotPasswordCaptchaRef.current;
        if (!canvas) return; // Early return if canvas not mounted

        const ctx = canvas.getContext('2d');
        if (!ctx) return; // Early return if context not available
        
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let captcha = '';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0fdf4');
        gradient.addColorStop(1, '#dcfce7');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set font properties
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const charWidth = canvas.width / 8;
        const startX = charWidth;
        const centerY = canvas.height / 2;

        // Generate and draw characters
        for (let i = 0; i < 6; i++) {
            const char = chars.charAt(Math.floor(Math.random() * chars.length));
            captcha += char;
            
            const hue = Math.floor(Math.random() * 360);
            ctx.fillStyle = `hsl(${hue}, 50%, 30%)`;

            const x = startX + (i * charWidth);
            const y = centerY + (Math.random() * 6 - 3);
            ctx.fillText(char, x, y);
        }

        // Add noise lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, 0);
            ctx.lineTo(Math.random() * canvas.width, canvas.height);
            ctx.stroke();
        }

        setForgotPasswordCaptchaText(captcha);
        setForgotPasswordCaptchaInput('');
        setIsForgotPasswordCaptchaCorrect(null);
    }, [forgotPasswordCaptchaRef]);

    useEffect(() => {
        localStorage.removeItem('forcedLogout');
        localStorage.removeItem('logoutReason');
        const sessionNotification = document.querySelector('.session-info-notification');
        if (sessionNotification && document.body.contains(sessionNotification)) {
            document.body.removeChild(sessionNotification);
        }
        if (SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getSessionItem('loggedIn') === 'true') {
            // Get user level from secure storage
            const userLevel = SecureStorage.getLocalItem('user_level') || SecureStorage.getSessionItem('user_level');
            
            // Navigate based on user level
            switch(userLevel) {
                case 'Super Admin':
                case 'Admin':
                    navigateTo('/adminDashboard');
                    break;
                case 'Personnel':
                    navigateTo('/Personnel/Dashboard');
                    break;
                case 'Dean':
                case 'Secretary':
                    navigateTo('/Department/Dashboard');
                    break;
                case 'Faculty/Staff':
                    navigateTo('/Faculty/Dashboard');
                    break;
                default:
                    // If no valid user level, clear everything except API URL
                    const savedApiUrl = SecureStorage.getLocalItem("url");
                    localStorage.clear();
                    sessionStorage.clear();
                    removeSessionCookie('userSession');
                    if (savedApiUrl) {
                        SecureStorage.setLocalItem("url", savedApiUrl);
                    }
            }
            return; // Exit early after navigation
        }

        // Continue with normal login page initialization
        const timer = setTimeout(() => {
            if (captchaCanvasRef.current) {
                generateCaptcha();
            }
        }, 100);

        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }

        controls.start({
            scale: [1, 1.1, 1],
            transition: { 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse" 
            }
        });

        return () => clearTimeout(timer);
    }, [controls, navigateTo, captchaCanvasRef, generateCaptcha]);

    useEffect(() => {
        if (showCaptchaAfterEmail) {
            // Delay captcha generation to ensure canvas is mounted
            const timer = setTimeout(() => {
                if (forgotPasswordCaptchaRef.current) {
                    generateForgotPasswordCaptcha();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showCaptchaAfterEmail, forgotPasswordCaptchaRef, generateForgotPasswordCaptcha]);

    useEffect(() => {
        let intervalId;
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const now = Date.now();
                const timePassed = Math.floor((now - lastTimerUpdate) / 1000);
                
                if (showLoginOTP && loginResendTimer > 0) {
                    setLoginResendTimer(prev => Math.max(0, prev - timePassed));
                }
                
                setLastTimerUpdate(now);
            }
        };

        if (showLoginOTP && loginResendTimer > 0) {
            intervalId = setInterval(() => {
                setLastTimerUpdate(Date.now());
                
                if (showLoginOTP) {
                    setLoginResendTimer((prev) => {
                        if (prev <= 1) {
                            setCanResendLoginOtp(true);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);

            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [showLoginOTP, loginResendTimer, lastTimerUpdate, setCanResendLoginOtp]);

    useEffect(() => {
        // Initialize session timeout handling with enhanced 1-minute inactivity detection
        const cleanup = initializeSessionManager(navigateTo);
        
        // Check for existing session on load
        const checkExistingSession = () => {
            const isLoggedIn = SecureStorage.getLocalItem('loggedIn') === 'true' || SecureStorage.getSessionItem('loggedIn');
            const userSession = document.cookie.includes('userSession=');
            
            // If we have localStorage but no valid session cookie, log out
            if (isLoggedIn && !userSession) {
                const savedApiUrl = localStorage.getItem("url");
                localStorage.clear();
                sessionStorage.clear();
                
                // Preserve API URL
                if (savedApiUrl) {
                    localStorage.setItem("url", savedApiUrl);
                }
                
                navigateTo('/');
            }
        };
        
        checkExistingSession();
        
        return () => cleanup();
    }, [navigateTo]);

    

    

    const handleCaptchaInput = (e) => {
        const input = e.target.value;
        setUserCaptchaInput(input);
        setIsCaptchaCorrect(input === captchaText);
    };

    const handleForgotPasswordCaptchaInput = (e) => {
        const input = e.target.value;
        setForgotPasswordCaptchaInput(input);
        setIsForgotPasswordCaptchaCorrect(input === forgotPasswordCaptchaText);
    };

    const notify = (message, type = 'success') => {
        toast[type](message, {
            duration: 4000, // Increased duration for blocked messages
            position: 'top-right',
            style: {
                borderRadius: '10px',
                background: type === 'error' ? '#FEE2E2' : '#ECFDF5',
                color: type === 'error' ? '#DC2626' : '#059669',
            },
            iconTheme: {
                primary: type === 'error' ? '#DC2626' : '#059669',
                secondary: 'white',
            },
        });
    };

    const validateSchoolId = (id) => {
        const schoolIdPattern = /^[^-]+-[^-]+-[^-]+$/;
        return schoolIdPattern.test(id);
    };

    const handleUsernameChange = (e) => {
        const input = e.target.value;
        setUsername(input);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
    
        if (!username || !password || !isCaptchaCorrect) {
            notify("Please fill in all fields and complete the CAPTCHA correctly.", 'error');
            generateCaptcha(); // Refresh captcha on validation failure
            return;
        }
    
        if (!validateSchoolId(username)) {
            notify("Invalid school ID format.", 'error');
            generateCaptcha(); // Refresh captcha on validation failure
            return;
        }
    
        setLoading(true);
        
        // Always clear these flags on login attempt
        localStorage.removeItem('forcedLogout');
        localStorage.removeItem('logoutReason');
        
        // Remove any existing session notification elements
        const sessionNotification = document.querySelector('.session-info-notification');
        if (sessionNotification && document.body.contains(sessionNotification)) {
            document.body.removeChild(sessionNotification);
        }
    
        try {
            // Get and decrypt the stored URL
            const encryptedUrl = SecureStorage.getLocalItem("url");
            if (!encryptedUrl) {
                notify("API URL configuration is missing. Please contact support.", 'error');
                setLoading(false);
                return;
            }
            
            const apiUrl = encryptedUrl;
            console.log("Using API URL:", apiUrl);
            
            const loginResponse = await axios.post(`${apiUrl}login.php`, {
                operation: "login",
                json: { 
                    username: username, 
                    password: password 
                }
            });
    
            console.log("Login response:", loginResponse.data);
            
            if (loginResponse.data.status === "success") {
                const userData = loginResponse.data.data;
                console.log("User data received:", userData);
                
                // Clear any previous state
                removeSessionCookie('userSession');
                localStorage.removeItem('forcedLogout');
                localStorage.removeItem('logoutReason');
                
                // Set initial activity timestamp using the centralized function
                updateLastActivity();
                
                // Set encrypted session cookie with 1-minute expiry
                setSessionCookie('userSession', {
                    user_id: userData.user_id,
                    school_id: userData.school_id,
                    user_level: userData.user_level_name,
                    timestamp: new Date().getTime() // Add timestamp for additional security
                });
    
                // Now we'll check for 2FA status
                const otpResponse = await axios.post(`${apiUrl}update_master2.php`, {
                    operation: "sendLoginOTP",
                    json: { 
                        id: userData.user_id
                    }
                });
                
                console.log("OTP response:", otpResponse.data);
                
                // Check the specific message from the API
                if (otpResponse.data.status === "success") {
                    if (otpResponse.data.message === "Login OTP sent successfully") {
                        // Store user_id temporarily for OTP verification
                        SecureStorage.setSessionItem("temp_user_id", userData.user_id);
                        
                        // Show OTP input form
                        setShowLoginOTP(true);
                        notify("OTP has been sent to your email. Please verify.");
                    } else if (otpResponse.data.message === "2FA is not active for this user") {
                        // 2FA is not active, proceed with direct login
                        console.log("2FA not active, proceeding with direct login");
                        
                        // Save API URL before clearing localStorage
                        const savedApiUrl = apiUrl;
                        
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // Restore API URL
                        SecureStorage.setLocalItem("url", savedApiUrl);
                
                        // Set localStorage items securely
                        SecureStorage.setLocalItem("user_id", userData.user_id);
                        SecureStorage.setLocalItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                        SecureStorage.setLocalItem("school_id", userData.school_id);
                        SecureStorage.setLocalItem("Department Name", userData.department_name);
                        SecureStorage.setLocalItem("contact_number", userData.contact_number);
                        SecureStorage.setLocalItem("user_level", userData.user_level_name);
                        SecureStorage.setLocalItem("user_level_id", userData.user_level_id);
                        SecureStorage.setLocalItem("department_id", userData.department_id);
                        SecureStorage.setLocalItem("profile_pic", userData.profile_pic || "");
                        SecureStorage.setLocalItem("loggedIn", "true");
                        SecureStorage.setLocalItem("lastActivity", Date.now().toString());
                        

                        SecureStorage.setSessionItem("user_id", userData.user_id);
                        SecureStorage.setSessionItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                        SecureStorage.setSessionItem("school_id", userData.school_id);
                        SecureStorage.setSessionItem("Department Name", userData.department_name);
                        SecureStorage.setSessionItem("contact_number", userData.contact_number);
                        SecureStorage.setSessionItem("user_level", userData.user_level_name);
                        SecureStorage.setSessionItem("user_level_id", userData.user_level_id);
                        SecureStorage.setSessionItem("department_id", userData.department_id);
                        SecureStorage.setSessionItem("profile_pic", userData.profile_pic || "");
                        SecureStorage.setSessionItem("loggedIn", "true");

                        refreshSessionCookie('userSession');
                
                        // Handle "Remember Me" functionality
                        if (rememberMe) {
                            localStorage.setItem("rememberedUsername", username);
                        } else {
                            localStorage.removeItem("rememberedUsername");
                        }

                        // Log user data and storage operations
                        console.log("User data:", userData);
                        console.log("Setting user level:", userData.user_level_name);
                    
                        
                        // Get the stored user level (it's automatically decrypted by getLocalItem)
                        const userLevel = SecureStorage.getLocalItem("user_level");
                        console.log("Retrieved user level:", userLevel);

                        // Navigate based on user level
                        switch(userLevel) {
                            case "Super Admin":
                                notify("Super Admin Login Successful");
                                setTimeout(() => navigateTo("/adminDashboard"), 100);
                                break;
                            case "Personnel":
                                notify("Personnel Login Successful");
                                setTimeout(() => navigateTo("/Personnel/Dashboard"), 100);
                                break;
                            case "Admin":
                                notify("Admin Login Successful");
                                setTimeout(() => navigateTo("/adminDashboard"), 100);
                                break;
                            case "Dean":
                            case "Department Head":
                                notify("Dean Login Successful");
                                setTimeout(() => navigateTo("/Department/Dashboard"), 100);
                                break;
                            default:
                                notify("User Login Successful");
                                setTimeout(() => navigateTo("/Faculty/Dashboard"), 100);
                        }
                    } else {
                        // Unknown success message, default to OTP verification to be safe
                        SecureStorage.setSessionItem("temp_user_id", userData.user_id);
                        setShowLoginOTP(true);
                        notify("Verification required. Please check your email for an OTP.");
                    }
                } else {

                    
                    // Save API URL before clearing localStorage
                    const savedApiUrl = apiUrl;
                    
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Restore API URL
                    SecureStorage.setLocalItem("url", savedApiUrl);

                    // Set localStorage items securely
                    SecureStorage.setLocalItem("user_id", userData.user_id);
                    SecureStorage.setLocalItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    SecureStorage.setLocalItem("school_id", userData.school_id);
                    SecureStorage.setLocalItem("contact_number", userData.contact_number);
                    SecureStorage.setLocalItem("user_level", userData.user_level_name);
                    SecureStorage.setLocalItem("user_level_id", userData.user_level_id);
                    SecureStorage.setLocalItem("department_id", userData.department_id);
                    SecureStorage.setLocalItem("profile_pic", userData.profile_pic || "");
                    SecureStorage.setLocalItem("loggedIn", "true");
                    SecureStorage.setLocalItem("lastActivity", Date.now().toString());
                    
                    SecureStorage.setSessionItem("user_id", userData.user_id);
                    SecureStorage.setSessionItem("name", `${userData.firstname} ${userData.middlename} ${userData.lastname}`.trim());
                    SecureStorage.setSessionItem("school_id", userData.school_id);
                    SecureStorage.setSessionItem("contact_number", userData.contact_number);
                    SecureStorage.setSessionItem("user_level", userData.user_level_name);
                    SecureStorage.setSessionItem("user_level_id", userData.user_level_id);
                    SecureStorage.setSessionItem("department_id", userData.department_id);
                    SecureStorage.setSessionItem("profile_pic", userData.profile_pic || "");
                    SecureStorage.setSessionItem("loggedIn", "true");

                    refreshSessionCookie('userSession');

                    // Handle "Remember Me" functionality
                    if (rememberMe) {
                        localStorage.setItem("rememberedUsername", username);
                    } else {
                        localStorage.removeItem("rememberedUsername");
                    }
                    
                    // Navigate based on user level
                    const userLevel = SecureStorage.getLocalItem("user_level");
                    switch(userLevel) {
                        case "Super Admin":
                            notify("Super Admin Login Successful");
                            setTimeout(() => navigateTo("/adminDashboard"), 100);
                            break;
                        case "Personnel":
                            notify("Personnel Login Successful");
                            setTimeout(() => navigateTo("/Personnel/Dashboard"), 100);
                            break;
                        case "Admin":
                            notify("Admin Login Successful");
                            setTimeout(() => navigateTo("/adminDashboard"), 100);
                            break;
                        case "Dean":
                        case "Department Head":
                            notify("Dean Login Successful");
                            setTimeout(() => navigateTo("/Department/Dashboard"), 100);
                            break;
                        default:
                            notify("User Login Successful");
                            setTimeout(() => navigateTo("/Faculty/Dashboard"), 100);
                    }
                }
            } else {
                // Password is incorrect
                notify("Incorrect password. Please try again.", 'error');
                generateCaptcha();
            }
        } catch (error) {
            console.error('Login error:', error);
            removeSessionCookie('userSession');
            notify("Login failed. Please try again.", 'error');
            generateCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const handleCheckEmail = async () => {
        if (!email) {
            notify("Please enter your email address", 'error');
            return;
        }

        setIsVerifyingEmail(true);
        try {
            const response = await axios.post(`${localStorage.getItem("url")}login.php`, {
                operation: "checkEmail",
                json: { email }
            });

            if (response.data.status === "exists") {
                setIsEmailValid(true);
                setShowCaptchaAfterEmail(true);
                generateCaptcha();
            } else {
                setIsEmailValid(false);
                notify("Email not found in our records", 'error');
            }
        } catch (error) {
            notify("Error verifying email", 'error');
        } finally {
            setIsVerifyingEmail(false);
        }
    };

    const handleSendOTP = async (isResend = false) => {
        if (!isResend && !isForgotPasswordCaptchaCorrect) {
            notify("Please complete the CAPTCHA verification", 'error');
            return;
        }

        if (isResend) {
            setIsResending(true);
        } else {
            setIsSendingOtp(true);
        }

        try {
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "send_password_reset_otp",
                email: email
            });

            if (response.data.status === "success") {
                setResetKey(response.data.key);
                setShowOtpInput(true);
                setResendTimer(180); // Reset timer
                setCanResendOtp(false);
                notify(isResend ? "OTP resent successfully" : "OTP sent to your email", 'success');
            } else {
                notify(response.data.message || "Failed to send OTP", 'error');
            }
        } catch (error) {
            notify(error.response?.data?.message || "Error sending OTP", 'error');
        } finally {
            if (isResend) {
                setIsResending(false);
            } else {
                setIsSendingOtp(false);
            }
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return; // Only allow single digit

        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = value;
        setOtpDigits(newOtpDigits);

        // Move to next input if value is entered
        if (value && index < 5) {
            otpRefs[index + 1].current.focus();
        }
        
        // Auto-verify if all digits are filled
        if (value && index === 5) {
            const allFilled = newOtpDigits.every(digit => digit !== '');
            if (allFilled) {
                handleVerifyOtp();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace if current input is empty
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs[index - 1].current.focus();
        }
        // Trigger verification on Enter if all digits are filled
        if (e.key === 'Enter') {
            const allFilled = otpDigits.every(digit => digit !== '');
            if (allFilled) {
                handleVerifyOtp();
            }
        }
    };

    const handleVerifyOtp = async () => {
        const otpValue = otpDigits.join('');
        if (otpValue.length !== 6) {
            notify("Please enter complete OTP", 'error');
            return;
        }

        try {
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "validate_otp",
                otp: otpValue,
                email: email // Add email parameter to the request
            });

            if (response.data.status === "success") {
                setShowPasswordReset(true);
                notify("OTP verified successfully");
            } else {
                notify(response.data.message || "Invalid OTP", 'error');
                setOtpDigits(Array(6).fill(''));
            }
        } catch (error) {
            notify("Error validating OTP", 'error');
        }
    };

    const handlePasswordReset = async () => {
        if (!isPasswordValid()) {
            notify("Please ensure password meets all requirements", 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            notify("Passwords do not match", 'error');
            return;
        }

        try {
            const response = await axios.post(`${localStorage.getItem("url")}update_master2.php`, {
                operation: "update_password",
                email: email,
                password: newPassword
            });

            if (response.data.status === "success") {
                notify("Password successfully updated");
                handleModalClose();
            } else {
                notify(response.data.message || "Failed to update password", 'error');
            }
        } catch (error) {
            notify("Error updating password", 'error');
        }
    };

    const handleEmailKeyPress = (e) => {
        if (e.key === 'Enter' && !showCaptchaAfterEmail) {
            e.preventDefault();
            handleCheckEmail();
        }
    };

    const handleCaptchaKeyPress = (e) => {
        if (e.key === 'Enter' && showCaptchaAfterEmail) {
            e.preventDefault();
            handleSendOTP();
        }
    };

    const handlePasswordKeyPress = (e) => {
        if (e.key === 'Enter' && isPasswordValid() && newPassword === confirmPassword) {
            handlePasswordReset();
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleModalClose = () => {
        setShowForgotPassword(false);
        // Don't clear email
        setIsEmailValid(null);
        setForgotPasswordCaptchaInput('');
        setIsForgotPasswordCaptchaCorrect(null);
        setShowCaptchaAfterEmail(false);
        setOtpDigits(Array(6).fill(''));
        setShowOtpInput(false);
        setResendTimer(180);
        setCanResendOtp(false);
    };


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

    const handleLoginOtpChange = (index, value) => {
        if (value.length > 1) return;

        const newOtpDigits = [...loginOtpDigits];
        newOtpDigits[index] = value;
        setLoginOtpDigits(newOtpDigits);

        if (value && index < 5) {
            loginOtpRefs[index + 1].current.focus();
        }
    };

    const handleLoginOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !loginOtpDigits[index] && index > 0) {
            loginOtpRefs[index - 1].current.focus();
        }
    };

    const handleVerifyLoginOTP = async () => {
        const otpValue = loginOtpDigits.join('');
        if (otpValue.length !== 6) {
            notify("Please enter complete OTP", 'error');
            return;
        }

        setIsVerifyingLoginOtp(true);
        try {
            // Get user_id if it was stored temporarily during initial login attempt
            const userData = SecureStorage.getSessionItem("temp_user_id") || username;
            const apiUrl = SecureStorage.getLocalItem("url");
            
            // Verify OTP
            const response = await axios.post(`${apiUrl}update_master2.php`, {
                operation: "validateLoginOTP",
                json: { 
                    id: userData,
                    otp: otpValue
                }
            });
            console.log(response.data)

            if (response.data.status === "success" && response.data.authenticated) {
                // If authenticated, process the user data
                // Get the API URL
                const apiUrl = SecureStorage.getLocalItem("url");
                
                // Clear existing storage but preserve API URL
                localStorage.clear();
                sessionStorage.clear();
                
                // Restore API URL
                SecureStorage.setLocalItem("url", apiUrl);

                // Check if user data is available in the response
                if (response.data.user_data) {
                    // Use user data directly from the response
                    const userDetails = response.data.user_data;
                    
                    // Set localStorage items securely
                    SecureStorage.setLocalItem("user_id", userDetails.user_id);
                    SecureStorage.setLocalItem("name", `${userDetails.firstname} ${userDetails.middlename} ${userDetails.lastname}`.trim());
                    SecureStorage.setLocalItem("school_id", userDetails.school_id);
                    SecureStorage.setLocalItem("contact_number", userDetails.contact_number);
                    SecureStorage.setLocalItem("user_level", userDetails.user_level_name);
                    SecureStorage.setLocalItem("user_level_id", userDetails.user_level_id);
                    SecureStorage.setLocalItem("department_id", userDetails.department_id);
                    SecureStorage.setLocalItem("profile_pic", userDetails.profile_pic || "");
                    SecureStorage.setLocalItem("loggedIn", "true");
                    SecureStorage.setLocalItem("lastActivity", Date.now().toString());
                
                    // Set sessionStorage items securely
                    SecureStorage.setSessionItem("user_id", userDetails.user_id);
                    SecureStorage.setSessionItem("name", `${userDetails.firstname} ${userDetails.middlename} ${userDetails.lastname}`.trim());
                    SecureStorage.setSessionItem("school_id", userDetails.school_id);
                    SecureStorage.setSessionItem("contact_number", userDetails.contact_number);
                    SecureStorage.setSessionItem("user_level", userDetails.user_level_name);
                    SecureStorage.setSessionItem("user_level_id", userDetails.user_level_id);
                    SecureStorage.setSessionItem("department_id", userDetails.department_id);
                    SecureStorage.setSessionItem("profile_pic", userDetails.profile_pic || "");
                    SecureStorage.setSessionItem("loggedIn", "true");
                    
                    // Set session cookie
                    setSessionCookie('userSession', {
                        user_id: userDetails.user_id,
                        school_id: userDetails.school_id,
                        user_level: userDetails.user_level_name,
                        timestamp: new Date().getTime()
                    });
                    
                    // Navigate based on user level
                    const userLevel = userDetails.user_level_name;
                    switch(userLevel) {
                        case "Super Admin":
                            notify("Super Admin Login Successful");
                            setTimeout(() => navigateTo("/adminDashboard"), 100);
                            break;
                        case "Personnel":
                            notify("Personnel Login Successful");
                            setTimeout(() => navigateTo("/Personnel/Dashboard"), 100);
                            break;
                        case "Admin":
                            notify("Admin Login Successful");
                            setTimeout(() => navigateTo("/adminDashboard"), 100);
                            break;
                        case "Dean":
                        case "Secretary":
                            notify("Dean Login Successful");
                            setTimeout(() => navigateTo("/Department/Dashboard"), 100);
                            break;
                        default:
                            notify("User Login Successful");
                            setTimeout(() => navigateTo("/Faculty/Dashboard"), 100);
                    }
                } else {
                    // If user_data is not in the response, we need to fetch user details
                    // using the user_id from the authentication response
                    const userId = response.data.user_id;
                    
                    // Set basic authenticated state
                    SecureStorage.setLocalItem("user_id", userId);
                    SecureStorage.setLocalItem("loggedIn", "true");
                    SecureStorage.setLocalItem("lastActivity", Date.now().toString());
                    
                    SecureStorage.setSessionItem("user_id", userId);
                    SecureStorage.setSessionItem("loggedIn", "true");
                    
                    // Set cookie with limited data
                    setSessionCookie('userSession', {
                        user_id: userId,
                        timestamp: new Date().getTime()
                    });
                    
                    // Fetch the user's full details
                    try {
                        const userDetailsResponse = await axios.post(`${apiUrl}fetchMaster.php`, {
                            operation: "fetchUsersById",
                            id: userId
                        });
                        
                        console.log("User details fetched:", userDetailsResponse.data);
                        
                        if (userDetailsResponse.data.status === "success" && 
                            userDetailsResponse.data.data && 
                            userDetailsResponse.data.data.length > 0) {
                            
                            const userDetails = userDetailsResponse.data.data[0];
                            
                            // Set full user data
                            SecureStorage.setLocalItem("name", `${userDetails.users_fname} ${userDetails.users_mname} ${userDetails.users_lname}`.trim());
                            SecureStorage.setLocalItem("school_id", userDetails.users_school_id);
                            SecureStorage.setLocalItem("contact_number", userDetails.users_contact_number);
                            SecureStorage.setLocalItem("user_level", userDetails.user_level_name);
                            SecureStorage.setLocalItem("user_level_id", userDetails.users_user_level_id);
                            SecureStorage.setLocalItem("department_id", userDetails.users_department_id);
                            SecureStorage.setLocalItem("profile_pic", userDetails.users_pic || "");
                            
                            SecureStorage.setSessionItem("name", `${userDetails.users_fname} ${userDetails.users_mname} ${userDetails.users_lname}`.trim());
                            SecureStorage.setSessionItem("school_id", userDetails.users_school_id);
                            SecureStorage.setSessionItem("contact_number", userDetails.users_contact_number);
                            SecureStorage.setSessionItem("user_level", userDetails.user_level_name);
                            SecureStorage.setSessionItem("user_level_id", userDetails.users_user_level_id);
                            SecureStorage.setSessionItem("department_id", userDetails.users_department_id);
                            SecureStorage.setSessionItem("profile_pic", userDetails.users_pic || "");
                            
                            // Update session cookie with more details
                            refreshSessionCookie('userSession');
                            
                            // Navigate based on user level
                            const userLevel = userDetails.user_level_name;
                            switch(userLevel) {
                                case "Super Admin":
                                    notify("Super Admin Login Successful");
                                    setTimeout(() => navigateTo("/adminDashboard"), 100);
                                    break;
                                case "Personnel":
                                    notify("Personnel Login Successful");
                                    setTimeout(() => navigateTo("/Personnel/Dashboard"), 100);
                                    break;
                                case "Admin":
                                    notify("Admin Login Successful");
                                    setTimeout(() => navigateTo("/adminDashboard"), 100);
                                    break;
                                case "Dean":
                                case "Secretary":
                                    notify("Dean Login Successful");
                                    setTimeout(() => navigateTo("/Department/Dashboard"), 100);
                                    break;
                                default:
                                    notify("User Login Successful");
                                    setTimeout(() => navigateTo("/Faculty/Dashboard"), 100);
                            }
                        } else {
                            // If user details fetch fails, redirect to login
                            notify("Authentication successful but failed to load user details. Please try again.", 'error');
                            navigateTo("/");
                        }
                    } catch (error) {
                        console.error("Error fetching user details:", error);
                        notify("Authentication successful but failed to load user details. Please try again.", 'error');
                        navigateTo("/");
                    }
                }
                
                // Handle "Remember Me" functionality
                if (rememberMe) {
                    localStorage.setItem("rememberedUsername", username);
                } else {
                    localStorage.removeItem("rememberedUsername");
                }
            } else {
                notify("Invalid OTP", 'error');
                console.log(response.data)
                setLoginOtpDigits(Array(6).fill(''));
            }
        } catch (error) {
            console.error('Error during OTP verification:', error);
            notify("Error verifying OTP", 'error');
            setLoginOtpDigits(Array(6).fill(''));
        } finally {
            setIsVerifyingLoginOtp(false);
        }
    };

    const handleResendLoginOTP = async () => {
        setIsResendingLoginOtp(true);
        try {
            const userData = SecureStorage.getSessionItem("temp_user_id");
            const apiUrl = SecureStorage.getLocalItem("url");
            
            const response = await axios.post(`${apiUrl}update_master2.php`, {
                operation: "sendLoginOTP",
                json: { 
                    id: userData || username
                }
            });

            if (response.data.status === "success") {
                setLoginResendTimer(180);
                setCanResendLoginOtp(false);
                
                if (response.data.message === "Login OTP sent successfully") {
                    notify("OTP has been resent to your email");
                } else if (response.data.message === "2FA is not active for this user") {
                    notify("2FA is not active for this user");
                } else {
                    notify("OTP request processed");
                }
            } else {
                notify(response.data.message || "Failed to resend OTP", 'error');
            }
        } catch (error) {
            notify("Error resending OTP", 'error');
        } finally {
            setIsResendingLoginOtp(false);
        }
    };

    return (
        <div className="min-h-screen bg-accent-light overflow-hidden font-sans">
            <div className="relative h-full min-h-screen flex flex-col lg:flex-row">
                {/* Decoration Elements */}
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-primary-dark to-accent-dark transform -skew-y-6 origin-top-right -translate-y-40 z-0"></div>
                
                {/* Left Section - Branding and Features */}
                <div className="hidden lg:flex lg:w-1/2 relative z-10 bg-accent-light shadow-2xl">
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Abstract Background Pattern */}
                        <svg className="absolute left-0 top-0 h-full w-full transform translate-x-1/2" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                            <g fill="none" stroke="rgba(0, 128, 128, 0.05)" strokeWidth="2">
                                <circle cx="400" cy="400" r="200"/>
                                <circle cx="400" cy="400" r="250"/>
                                <circle cx="400" cy="400" r="300"/>
                                <circle cx="400" cy="400" r="350"/>
                                <circle cx="400" cy="400" r="400"/>
                            </g>
                            <rect x="300" y="300" width="200" height="200" fill="rgba(0, 128, 128, 0.03)" transform="rotate(45 400 400)"/>
                            <rect x="250" y="250" width="300" height="300" fill="rgba(0, 128, 128, 0.02)" transform="rotate(45 400 400)"/>
                        </svg>
                    </div>
                    
                    <div className="relative h-full w-full flex flex-col justify-center items-center px-12 py-24 z-10">
                        <div className="w-full max-w-md text-center mb-12">
                            <div className="flex justify-center mb-6">
                                <img 
                                    src="/images/assets/phinma.png" 
                                    alt="PHINMA CDO Logo" 
                                    className="w-24 h-24 object-contain filter drop-shadow-lg"
                                />
                            </div>
                            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary-dark to-accent-dark bg-clip-text text-transparent tracking-tight mb-3">
                                General Services Department
                            </h1>
                            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full mb-6"></div>
                            <h2 className="text-2xl font-medium text-gray-600 mb-8">
                                Reservation & Monitoring System
                            </h2>
                        </div>
                        
                       
                    </div>
                </div>
                
                {/* Right Section - Login Form */}
                <div className="w-full lg:w-1/2 flex justify-center items-center px-6 py-12 lg:px-12 relative z-10">
                    <div className="w-full max-w-md">
                        
                        {/* Mobile Logo (visible only on small screens) */}
                        <div className="flex flex-col items-center lg:hidden mb-10">
                            <img 
                                src="/images/assets/phinma.png" 
                                alt="PHINMA CDO Logo" 
                                className="w-20 h-20 object-contain mb-4"
                            />
                            <h1 className="text-2xl font-bold text-center text-gray-800">General Services Department</h1>
                            <p className="text-gray-500 text-center">Reservation & Monitoring System</p>
                        </div>

                        {/* Login Form or OTP Verification */}
                        {!showLoginOTP ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white rounded-3xl shadow-xl overflow-hidden"
                            >
                                <div className="p-8">
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
                                        <p className="text-gray-500 mt-2">Enter your credentials to continue</p>
                                    </div>
                                    
                                    <form onSubmit={handleLogin} className="space-y-6">
                                        {/* Username Field */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700" htmlFor="username">
                                                Username
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <FaUser className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                                </div>
                                                <input 
                                                    value={username} 
                                                    onChange={handleUsernameChange} 
                                                    className="block w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out" 
                                                    id="username" 
                                                    type="text"
                                                    placeholder="Enter your school ID (e.g., COL-2023-001)" 
                                                    required 
                                                />
                                            </div>

                                        </div>

                                        {/* Password Field */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                                                    Password
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotPassword(true)}
                                                    className="text-sm font-medium text-primary-dark hover:text-accent-dark transition-colors"
                                                >
                                                    Forgot password?
                                                </button>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <FaLock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                                </div>
                                                <input 
                                                    value={password} 
                                                    onChange={handlePasswordChange} 
                                                    className="block w-full pl-12 pr-12 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out" 
                                                    id="password" 
                                                    type={showPassword ? 'text' : 'password'} 
                                                    placeholder="Enter your password" 
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
                                        </div>

                                        {/* CAPTCHA Verification */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Security Verification
                                            </label>
                                            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                                <div className="p-4 bg-gray-50">
                                                    <canvas
                                                        ref={captchaCanvasRef}
                                                        width="280"
                                                        height="70"
                                                        className="w-full rounded-lg"
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100">
                                                    <p className="text-xs text-gray-500">Enter the characters shown above</p>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={generateCaptcha}
                                                        type="button"
                                                        className="p-2 text-emerald-600 hover:text-emerald-700 rounded-full hover:bg-emerald-50 transition-colors text-sm flex items-center"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                        </svg>
                                                        Refresh
                                                    </motion.button>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={userCaptchaInput}
                                                onChange={handleCaptchaInput}
                                                className={`block w-full px-4 py-3.5 bg-gray-50 border ${
                                                    isCaptchaCorrect === false ? 'border-red-500 bg-red-50' : 
                                                    isCaptchaCorrect === true ? 'border-emerald-500 bg-emerald-50' : 
                                                    'border-gray-200'
                                                } rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out`}
                                                placeholder="Type the characters here"
                                            />
                                            {isCaptchaCorrect === false && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    Incorrect CAPTCHA. Please try again.
                                                </p>
                                            )}
                                        </div>

                                        {/* Remember Me */}
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="rememberMe"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-colors"
                                            />
                                            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">Remember me</label>
                                        </div>

                                        {/* Sign In Button */}
                                        <button 
                                            className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-primary-dark to-accent-dark hover:from-primary-dark hover:to-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark shadow-lg shadow-primary-dark/30 transition-all duration-200 ease-in-out ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : null}
                                            {loading ? 'Signing In...' : 'Sign In'}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        ) : (
                            /* OTP Verification Form */
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white rounded-3xl shadow-xl overflow-hidden"
                            >
                                <div className="p-8">
                                    <div className="text-center mb-8">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800">Two-Factor Authentication</h2>
                                        <p className="text-gray-500 mt-2">Enter the verification code sent to your email</p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {/* OTP Input Fields */}
                                        <div className="flex justify-between space-x-2">
                                            {loginOtpDigits.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    ref={loginOtpRefs[index]}
                                                    type="text"
                                                    maxLength="1"
                                                    value={digit}
                                                    onChange={(e) => handleLoginOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleLoginOtpKeyDown(index, e)}
                                                    className="w-full h-14 text-center text-xl font-medium bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Verify Button */}
                                        <button
                                            onClick={handleVerifyLoginOTP}
                                            disabled={isVerifyingLoginOtp}
                                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/30 transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isVerifyingLoginOtp ? (
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : null}
                                            {isVerifyingLoginOtp ? 'Verifying...' : 'Verify Code'}
                                        </button>
                                        
                                        {/* Resend Option */}
                                        <div className="text-center">
                                            {loginResendTimer > 0 ? (
                                                <p className="text-sm text-gray-600 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Resend code in {formatTime(loginResendTimer)}
                                                </p>
                                            ) : (
                                                <button
                                                    onClick={handleResendLoginOTP}
                                                    disabled={isResendingLoginOtp}
                                                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center justify-center mx-auto"
                                                >
                                                    {isResendingLoginOtp ? (
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    )}
                                                    {isResendingLoginOtp ? 'Resending...' : 'Resend verification code'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* We'll update the Modal in a separate edit */}
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

            <Modal
                title={null}
                open={showForgotPassword}
                onCancel={handleModalClose}
                footer={null}
                maskClosable={false}
                width={480}
                className="modern-modal"
                closeIcon={
                    <span className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </span>
                }
            >
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Reset Your Password</h2>
                        <p className="text-gray-500 mt-2">{!showOtpInput ? "Enter your email to receive a verification code" : showPasswordReset ? "Create a new secure password" : "Enter the verification code sent to your email"}</p>
                    </div>

                    <div className="space-y-6">
                        {!showOtpInput ? (
                            <>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyPress={handleEmailKeyPress}
                                            className="block w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out"
                                            placeholder="Enter your email address"
                                            disabled={showCaptchaAfterEmail}
                                        />
                                    </div>
                                </div>

                                {!showCaptchaAfterEmail ? (
                                    <button
                                        onClick={handleCheckEmail}
                                        disabled={isVerifyingEmail}
                                        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/30 transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isVerifyingEmail ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Verifying Email...
                                            </>
                                        ) : (
                                            "Continue"
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                                                <div className="p-4 bg-gray-50">
                                                    <canvas
                                                        ref={forgotPasswordCaptchaRef}
                                                        width="280"
                                                        height="70"
                                                        className="w-full rounded-lg"
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center px-4 py-2 border-t border-gray-100">
                                                    <p className="text-xs text-gray-500">Enter the characters shown above</p>
                                                    <button
                                                        onClick={generateForgotPasswordCaptcha}
                                                        className="p-2 text-emerald-600 hover:text-emerald-700 rounded-full hover:bg-emerald-50 transition-colors text-sm flex items-center"
                                                        type="button"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                        </svg>
                                                        Refresh
                                                    </button>
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={forgotPasswordCaptchaInput}
                                                onChange={handleForgotPasswordCaptchaInput}
                                                onKeyPress={handleCaptchaKeyPress}
                                                className={`block w-full px-4 py-3.5 bg-gray-50 border ${
                                                    isForgotPasswordCaptchaCorrect === false ? 'border-red-500 bg-red-50' : 
                                                    isForgotPasswordCaptchaCorrect === true ? 'border-emerald-500 bg-emerald-50' : 
                                                    'border-gray-200'
                                                } rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out`}
                                                placeholder="Type the characters here"
                                            />
                                            {isForgotPasswordCaptchaCorrect === false && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    Incorrect CAPTCHA. Please try again.
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleSendOTP}
                                            disabled={!isForgotPasswordCaptchaCorrect || isSendingOtp}
                                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/30 transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isSendingOtp ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Sending Code...
                                                </>
                                            ) : (
                                                "Send Verification Code"
                                            )}
                                        </button>
                                    </>
                                )}
                            </>
                        ) : !showPasswordReset ? (
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <p className="text-gray-600 text-sm">A verification code has been sent to:</p>
                                    <p className="text-gray-900 font-medium mt-1">{email}</p>
                                </div>
                                
                                <div className="flex justify-between space-x-2">
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={otpRefs[index]}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className="w-full h-14 text-center text-xl font-medium bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                        />
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <button
                                        onClick={handleVerifyOtp}
                                        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/30 transition-all duration-200 ease-in-out"
                                    >
                                        Verify Code
                                    </button>
                                    
                                    <div className="text-center">
                                        {!canResendOtp ? (
                                            <p className="text-sm text-gray-600 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Resend code in {formatTime(resendTimer)}
                                            </p>
                                        ) : (
                                            <button
                                                onClick={() => handleSendOTP(true)}
                                                disabled={isResending}
                                                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center justify-center mx-auto"
                                            >
                                                {isResending ? (
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                )}
                                                {isResending ? 'Resending...' : 'Resend verification code'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
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
                                            onKeyPress={handlePasswordKeyPress}
                                            className="block w-full pl-12 pr-12 py-3.5 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out"
                                            placeholder="Create a strong password"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)} 
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-500 transition-colors"
                                        >
                                            {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`flex items-center p-2 rounded-lg ${passwordStrength.length ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                                <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.length ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-xs">8+ characters</span>
                                            </div>
                                            <div className={`flex items-center p-2 rounded-lg ${passwordStrength.uppercase ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                                <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.uppercase ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-xs">Uppercase</span>
                                            </div>
                                            <div className={`flex items-center p-2 rounded-lg ${passwordStrength.lowercase ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                                <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.lowercase ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-xs">Lowercase</span>
                                            </div>
                                            <div className={`flex items-center p-2 rounded-lg ${passwordStrength.number ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                                <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.number ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-xs">Number</span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center p-2 rounded-lg ${passwordStrength.special ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                            <div className={`w-4 h-4 mr-2 rounded-full ${passwordStrength.special ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                            <span className="text-xs">Special character (!@#$%^&*)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FaLock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onKeyPress={handlePasswordKeyPress}
                                            className={`block w-full pl-12 pr-4 py-3.5 text-gray-900 bg-gray-50 border ${
                                                newPassword !== confirmPassword && confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                            } rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ease-in-out`}
                                            placeholder="Confirm your password"
                                        />
                                    </div>
                                    {newPassword !== confirmPassword && confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handlePasswordReset}
                                    disabled={!isPasswordValid() || newPassword !== confirmPassword}
                                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/30 transition-all duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    Reset Password
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Logins;
