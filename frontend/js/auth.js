// auth.js - Authentication management

import { api } from './api.js';

export const auth = {
    isLoggedIn: () => !!localStorage.getItem('access_token'),
    login: (token) => localStorage.setItem('access_token', token),
    logout: () => { localStorage.removeItem('access_token'); window.location.href = 'index.html'; },
    getToken: () => localStorage.getItem('access_token')
};

const errorDiv = document.getElementById('error-message');
const statusDiv = document.getElementById('status-message');

if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        if (errorDiv) errorDiv.classList.add('hidden');

        try {
            const resp = await api.login({ username, password });
            auth.login(resp.data.access_token);
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error('Login error', err);
            let message = 'Login failed';
            if (err.response) message = err.response.data?.detail || `Error ${err.response.status}`;
            if (errorDiv) { errorDiv.textContent = message; errorDiv.classList.remove('hidden'); }
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
}

if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const registerBtn = document.getElementById('register-btn');

        registerBtn.disabled = true;
        registerBtn.textContent = 'Registering...';
        if (statusDiv) { statusDiv.classList.remove('hidden'); statusDiv.textContent = 'Creating account...'; statusDiv.classList.remove('text-red-600'); statusDiv.classList.add('text-blue-600'); }
        if (errorDiv) errorDiv.classList.add('hidden');

        try {
            await api.register({ username, email, password });
            if (statusDiv) { statusDiv.classList.remove('text-red-600'); statusDiv.classList.add('text-green-600'); statusDiv.textContent = 'Registration successful; redirecting...'; }
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (err) {
            console.error('Registration error', err);
            let message = 'Registration failed';
            if (err.response) message = err.response.data?.detail || `Error ${err.response.status}`;
            if (statusDiv) statusDiv.classList.add('hidden');
            if (errorDiv) { errorDiv.textContent = message; errorDiv.classList.remove('hidden'); }
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    });
}
