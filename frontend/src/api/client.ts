import axios from 'axios';
import { toast } from 'sonner';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message: string = err.response?.data?.error ?? 'Something went wrong';
    toast.error(message);
    return Promise.reject(err);
  }
);

export default client;

