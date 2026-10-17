import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT || 'https://conceptual-e-commerce-platform-m2k7.vercel.app',
});

export default axiosInstance;