import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper to get JWT from localStorage
function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt');
  }
  return null;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to all requests if available
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API] Response error from ${error.config?.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

export const signalsApi = {
  getMySignals: async () => {
    console.log('[API] Fetching user signals...');
    const response = await api.get('/signals/my');
    console.log('[API] Signals fetched:', response.data);
    return response.data;
  },
  create: async (data: {
    ticker: string;
    companyName: string;
    name: string;
    description: string;
    leftMetric: string;
    operator: string;
    rightMetric: string;
    signalType: string;
    initialValues?: Record<string, any>;
  }) => {
    console.log('[API] Creating signal with data:', data);
    const response = await api.post('/signals', data);
    console.log('[API] Signal created:', response.data);
    return response.data;
  },
  toggle: async (id: number) => {
    console.log('[API] Toggling signal:', id);
    const response = await api.put(`/signals/${id}/toggle`);
    console.log('[API] Signal toggled:', response.data);
    return response.data;
  },
  getHistory: async (id: number) => {
    console.log('[API] Fetching signal history:', id);
    const response = await api.get(`/signals/${id}/history`);
    console.log('[API] Signal history:', response.data);
    return response.data;
  },
  getAvailableMetrics: async (ticker: string) => {
    console.log('[API] Fetching available metrics for:', ticker);
    const response = await api.get(`/signals/available-metrics/${ticker}`);
    console.log('[API] Available metrics:', response.data);
    return response.data;
  },
  getOperators: async () => {
    console.log('[API] Fetching operators...');
    const response = await api.get('/signals/operators');
    console.log('[API] Operators:', response.data);
    return response.data;
  },
  getSignalTypes: async () => {
    console.log('[API] Fetching signal types...');
    const response = await api.get('/signals/types');
    console.log('[API] Signal types:', response.data);
    return response.data;
  },
};

export default api; 