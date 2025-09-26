
// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost/gsd-reservation/backend/";

// Production API URL (uncomment when deploying)
// const API_BASE_URL = "https://your-production-api.com/backend/";

export const getApiBaseUrl = () => API_BASE_URL;

export default API_BASE_URL;
