import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 8000,
});

api.interceptors.response.use(
  (res) => res,
  (err) =>
    Promise.reject(
      new Error(err?.response?.data?.message || err.message || '요청 실패')
    )
);
