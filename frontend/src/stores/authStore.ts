import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import axios from 'axios';
import { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: 'student' | 'professor' | 'graduation_assistant') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  checkBackendHealth: () => Promise<boolean>;
  updateUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      checkBackendHealth: async () => {
        try {
          console.log('Checking backend health...');
          // Use relative URL that will go through Vite proxy
          const response = await axios.get('/api/health');
          console.log('Backend health response:', response.data);
          return response.data.status === 'healthy';
        } catch (err) {
          console.error('Backend health check failed:', err);
          return false;
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // First check if backend is healthy
          const isHealthy = await get().checkBackendHealth();
          if (!isHealthy) {
            throw new Error('Backend service is not available');
          }
          
          // For login, use application/x-www-form-urlencoded format
          const formData = new URLSearchParams();
          formData.append('username', email); // Backend expects 'username' not 'email'
          formData.append('password', password);
          formData.append('grant_type', 'password');
          
          console.log('Sending login request with:', formData.toString());
          
          // Use relative URL with axios
          const response = await axios.post('/api/v1/auth/login', formData.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
          
          console.log('Login response:', response.data);
          
          const { access_token, token_type } = response.data;
          
          // Now fetch the user data with the token
          const userResponse = await axios.get('/api/v1/users/me', {
            headers: {
              'Authorization': `${token_type} ${access_token}`
            }
          });
          
          set({ 
            token: access_token,
            user: userResponse.data,
            isAuthenticated: true,
            isLoading: false
          });
          
          localStorage.setItem('token', access_token);
          api.defaults.headers.common['Authorization'] = `${token_type} ${access_token}`;
        } catch (err) {
          console.error('Login error:', err);
          set({ 
            error: 'Invalid email or password', 
            isLoading: false,
            isAuthenticated: false
          });
          throw err;
        }
      },

      register: async (email: string, password: string, fullName: string, role: 'student' | 'professor' | 'graduation_assistant') => {
        try {
          set({ isLoading: true, error: null });
          
          // First check if backend is healthy
          const isHealthy = await get().checkBackendHealth();
          if (!isHealthy) {
            throw new Error('Backend service is not available');
          }
          
          console.log('Sending register request with:', { email, password, full_name: fullName, role });
          
          // Use relative URL with axios
          await axios.post('/api/v1/auth/register', { 
            email, 
            password,
            full_name: fullName || null,
            role
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          // Login after successful registration
          await get().login(email, password);
        } catch (err) {
          console.error('Registration error:', err);
          set({ 
            error: 'Registration failed. Try a different email.', 
            isLoading: false,
            isAuthenticated: false
          });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        
        try {
          set({ isLoading: true });
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token validity by fetching current user
          const response = await axios.get('/api/v1/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (err) {
          console.error('Token validation error:', err);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      updateUser: (user: AuthUser) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token
      }),
    }
  )
); 