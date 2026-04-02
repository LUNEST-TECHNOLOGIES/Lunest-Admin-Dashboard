import axios from 'axios';

// Base URL of your backend
const API_BASE_URL = process.env.VITE_PROD_API_URL || 'https://api.lunest.app/v1';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests automatically
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Handle responses
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired, redirect to login
            localStorage.removeItem('authToken');
            
            // Safer redirect to avoid "cannot set location.href" error
            if (typeof window !== 'undefined' && window.location) {
                window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;