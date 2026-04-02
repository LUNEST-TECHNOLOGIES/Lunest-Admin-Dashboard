import axios from 'axios';

// Determine API base URL based on environment
const getAPIBaseURL = () => {
    // Development: use localhost directly
    if (!import.meta.env.PROD) {
        return 'http://localhost:3000/v1';
    }
    // Production: use Netlify proxy to avoid CORS
    return '/api';
};

const API_BASE_URL = getAPIBaseURL();

console.log('[API] Environment:', import.meta.env.PROD ? 'production' : 'development');
console.log('[API] Base URL:', API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout for slow networks
    // Don't use withCredentials: true (app uses JWT tokens, not cookies)
    // withCredentials: true causes CORS conflicts with wildcard origins
});

// Retry logic state
let retryCount = {};
const MAX_RETRIES = 2;

// Add token to requests automatically
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`[Auth Header] Bearer ${token.substring(0, 30)}...`);
    } else {
        console.warn(`[API Request] ${config.method?.toUpperCase()} ${config.url} - NO TOKEN`);
    }
    console.log(`[Request Headers]`, config.headers);
    console.log(`[Request Body]`, config.data);
    return config;
}, (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
});

// Handle responses with retry logic
apiClient.interceptors.response.use(
    (response) => {
        const key = `${response.config.method}-${response.config.url}`;
        delete retryCount[key];
        console.log(`[API Response] ${response.status} ${response.config.url}`);
        return response;
    },
    async(error) => {
        const config = error.config;
        const key = `${config && config.method}-${config && config.url}`;

        const errorResponse = error.response || {};
        const errorConfig = error.config || {};

        // Enhanced error logging for network diagnostics
        console.error('[API Response Error]', {
            code: error.code,
            message: error.message,
            status: errorResponse.status,
            url: errorConfig.url,
            baseURL: apiClient.defaults.baseURL,
            fullURL: `${apiClient.defaults.baseURL}${errorConfig.url}`,
            data: errorResponse.data
        });

        // Handle 401 Unauthorized
        if (errorResponse.status === 401) {
            console.warn('[Auth] Unauthorized - redirecting to login');
            localStorage.removeItem('authToken');
            
            // Safer redirect to avoid "cannot set location.href" error
            if (typeof window !== 'undefined' && window.location) {
                window.location.replace('/login');
            }
            return Promise.reject(error);
        }

        // Handle network errors with retry
        if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) && config) {
            retryCount[key] = (retryCount[key] || 0) + 1;

            if (retryCount[key] <= MAX_RETRIES) {
                console.warn(`[Retry] Attempt ${retryCount[key]}/${MAX_RETRIES} for ${key}`);
                console.warn(`[Diagnostic] Backend at ${apiClient.defaults.baseURL} may not be running`);
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount[key]));
                return apiClient(config);
            } else {
                // Final failure message with diagnostic info
                console.error('[Final Error] Failed to connect to backend after retries:', {
                    backend: apiClient.defaults.baseURL,
                    endpoint: `${apiClient.defaults.baseURL}${config.url}`,
                    suggestion: 'Check if backend is running: npm run dev (in backend folder)',
                });
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;