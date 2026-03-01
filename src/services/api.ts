import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

const instance = axios.create({ baseURL: BASE, timeout: 30000 });

instance.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  res  => res.data,
  err  => Promise.reject(err.response?.data?.error || err.message),
);

export const apiClient = {
  get:    (url: string)                  => instance.get(url),
  post:   (url: string, data: any)       => instance.post(url, data),
  patch:  (url: string, data: any)       => instance.patch(url, data),
  delete: (url: string)                  => instance.delete(url),
};