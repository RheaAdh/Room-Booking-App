import axios from 'axios';

// API Base URL - dynamic based on environment
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8082/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add authentication headers
    const staffToken = localStorage.getItem('staffToken');
    const customerToken = localStorage.getItem('customerToken');
    
    console.log('Available tokens:', { staffToken: !!staffToken, customerToken: !!customerToken });
    
    if (staffToken) {
      config.headers.Authorization = `Bearer ${staffToken}`;
      console.log('Added staff token to request');
    } else if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`;
      console.log('Added customer token to request:', customerToken);
    }
    
    console.log('Final request headers:', config.headers);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
