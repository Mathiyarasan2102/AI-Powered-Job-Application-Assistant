import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,

    login: async (credentials) => {
        set({ loading: true });
        try {
            const { data } = await api.post('/auth/login', credentials);
            localStorage.setItem('token', data.token);
            set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
            return true;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },
    
    register: async (credentials) => {
        set({ loading: true });
        try {
            const { data } = await api.post('/auth/register', credentials);
            localStorage.setItem('token', data.token);
            set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
            return true;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    loadUser: async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const { data } = await api.get('/auth/me');
            set({ user: data.user, isAuthenticated: true });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },

    updateProfile: async (profileData) => {
        try {
            const { data } = await api.put('/user/profile', profileData);
            set({ user: data.user });
            return data.user;
        } catch (error) {
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    }
}));
