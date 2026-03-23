// guard.js - route access

import { auth } from './auth.js';
import { tools } from './tools.js';

document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();
    const loggedIn = auth.isLoggedIn();
    tools.setAuthenticated(loggedIn);

    if (page === 'dashboard.html' && !loggedIn) {
        window.location.href = 'login.html';
    }

    if ((page === 'login.html' || page === 'register.html') && loggedIn) {
        window.location.href = 'dashboard.html';
    }
});
