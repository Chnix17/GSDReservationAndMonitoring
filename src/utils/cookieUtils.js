import CryptoJS from 'crypto-js';
import { SecureStorage } from './encryption';

// Secret key for cookie encryption - in production, this should be an environment variable
const SECRET_KEY = 'phinma-gsd-system-2023';

// Configurable session timeouts
export const SESSION_TIMEOUTS = {
  SHORT: 30000,      // 30 seconds for testing
  MEDIUM: 300000,    // 5 minutes
  LONG: 900000,      // 15 minutes
  EXTENDED: 3600000  // 1 hour
};

export const SESSION_TIMEOUT = SESSION_TIMEOUTS.EXTENDED;

/**
 * Sets session timeout duration
 * @param {number} duration - Duration in milliseconds
 */
export const setSessionTimeoutDuration = (duration) => {
  SecureStorage.setLocalItem('sessionTimeoutDuration', duration.toString());
};

/**
 * Gets current session timeout duration
 * @returns {number} - Duration in milliseconds
 */
export const getSessionTimeoutDuration = () => {
  const stored = SecureStorage.getLocalItem('sessionTimeoutDuration');
  return stored ? parseInt(stored, 10) : SESSION_TIMEOUT;
};

/**
 * Sets an encrypted session cookie
 * @param {string} name - Cookie name
 * @param {object} value - Data to store in cookie
 * @param {number} expiry - Optional expiry in milliseconds
 */
export const setSessionCookie = (name, value, expiry = getSessionTimeoutDuration()) => {
  try {
    // Encrypt the value
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      SECRET_KEY
    ).toString();

    // Set the cookie with the encrypted value
    document.cookie = `${name}=${encrypted}; path=/; max-age=${Math.floor(
      expiry / 1000
    )}; SameSite=Strict; Secure`;
  } catch (error) {
    // Error handling without console.log
  }
};

/**
 * Gets and decrypts a session cookie
 * @param {string} name - Cookie name
 * @returns {object|null} - Decrypted cookie value or null if not found
 */
export const getSessionCookie = (name) => {
  try {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`));

    if (!cookie) return null;

    const encryptedValue = cookie.split('=')[1];
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY).toString(
      CryptoJS.enc.Utf8
    );

    return JSON.parse(decrypted);
  } catch (error) {
    // If there's an error decrypting, the cookie is invalid
    removeSessionCookie(name);
    return null;
  }
};

/**
 * Refreshes the session cookie with a new expiry time
 * @param {string} name - Cookie name
 * @returns {Promise<boolean>} - Success status
 */
export const refreshSessionCookie = async (name) => {
  try {
    const value = getSessionCookie(name);
    if (!value) return false;

    setSessionCookie(name, value);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Removes a session cookie
 * @param {string} name - Cookie name
 */
export const removeSessionCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure`;
};

/**
 * Checks if the session has timed out based on last activity
 * @returns {boolean} - True if session has timed out
 */
export const checkSessionTimeout = () => {
  const lastActivity = SecureStorage.getLocalItem('lastActivity');
  
  if (!lastActivity) return true;
  
  const now = Date.now();
  const lastActivityTime = parseInt(lastActivity, 10);
  
  // Check if more than the timeout period has passed since last activity
  return now - lastActivityTime > getSessionTimeoutDuration();
};

export const debugSession = () => {
  const cookieExists = document.cookie.split(';').some(c => c.trim().startsWith('userSession='));
  const lastActivity = SecureStorage.getLocalItem('lastActivity');
  const loggedIn = SecureStorage.getSessionItem('loggedIn') === 'true';
  const timeoutDuration = getSessionTimeoutDuration();
  
  // Create or get debug element
  let debugEl = document.getElementById('session-debug-manual');
  if (!debugEl) {
    debugEl = document.createElement('div');
    debugEl.id = 'session-debug-manual';
    debugEl.className = 'session-debug';
    document.body.appendChild(debugEl);
  }
  
  const timeLeft = lastActivity 
    ? Math.floor((parseInt(lastActivity, 10) + timeoutDuration - Date.now()) / 1000)
    : 0;
    
  // Get all cookies
  const allCookies = document.cookie.split(';').map(c => c.trim());
  
  debugEl.innerHTML = `
    <div class="debug-header">Session Debug</div>
    <div class="debug-item">Cookie: <span class="${cookieExists ? 'green' : 'red'}">${cookieExists ? 'Exists' : 'Missing'}</span></div>
    <div class="debug-item">localStorage logged in: <span class="${loggedIn ? 'green' : 'red'}">${loggedIn ? 'Yes' : 'No'}</span></div>
    <div class="debug-item">Last Activity: <span>${lastActivity ? new Date(parseInt(lastActivity, 10)).toLocaleTimeString() : 'None'}</span></div>
    <div class="debug-item">Timeout in: <span>${timeLeft > 0 ? timeLeft + ' seconds' : 'Expired'}</span></div>
    <div class="debug-item">Timeout setting: <span>${timeoutDuration/1000} seconds</span></div>
    <div class="debug-header">All Cookies</div>
    ${allCookies.map(c => `<div class="debug-item cookie-item">${c}</div>`).join('')}
    <div class="debug-actions">
      <button id="refresh-session-debug" class="debug-btn">Refresh</button>
      <button id="clear-session-debug" class="debug-btn warning">Clear All</button>
    </div>
  `;
  
  // Add event listeners
  document.getElementById('refresh-session-debug').addEventListener('click', () => {
    debugSession();
  });
  
  document.getElementById('clear-session-debug').addEventListener('click', () => {
    if (window.confirm('This will clear all session data. Continue?')) {
      // Clear everything
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      debugSession();
    }
  });
  
  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (document.body.contains(debugEl)) {
      debugEl.style.animation = 'slide-out 0.3s ease-in forwards';
      setTimeout(() => {
        if (document.body.contains(debugEl)) {
          document.body.removeChild(debugEl);
        }
      }, 300);
    }
  }, 15000);
};

// Enable debug mode through console
window.enableSessionDebug = () => {
  localStorage.setItem('debugSession', 'true');
};

window.disableSessionDebug = () => {
  localStorage.removeItem('debugSession');
};

window.showSessionDebug = debugSession;