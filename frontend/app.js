// 1. API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get headers with token (if your backend needs it later, currently basic)
const getHeaders = () => {
    return { 'Content-Type': 'application/json' };
};

// 2. Authentication Handling
const Auth = {
    getUser: () => JSON.parse(localStorage.getItem('user')),
    
    login: (userData) => {
        // Normalize ID
        const userWithId = { ...userData, id: userData.id || userData._id };
        localStorage.setItem('user', JSON.stringify(userWithId));
    },

    logout: () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    checkAuth: (requiredRole = null) => {
        const user = Auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        if (requiredRole && user.role !== requiredRole) {
            // Redirect to correct dashboard if wrong role
            window.location.href = user.role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
            return null;
        }
        return user;
    }
};

// 3. Dynamic Navbar Rendering
function renderNavbar() {
    const user = Auth.getUser();
    const navContainer = document.getElementById('navbar-placeholder');

    let navContent = `
    <nav class="navbar navbar-expand-lg navbar-custom mb-4">
        <div class="container">
            <a class="navbar-brand fw-bold" href="#">SIT725 Attendance</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav align-items-center">`;

    if (user) {
        navContent += `
            <li class="nav-item me-3">
                <span class="navbar-text">Hello, ${user.name}</span>
            </li>
            <li class="nav-item">
                <button onclick="Auth.logout()" class="btn btn-outline-light btn-sm">Logout</button>
            </li>`;
    } else {
        navContent += `
            <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
            <li class="nav-item"><a class="nav-link" href="register.html">Register</a></li>`;
    }

    navContent += `
                </ul>
            </div>
        </div>
    </nav>`;

    if (navContainer) navContainer.innerHTML = navContent;
}

// Initialize Navbar on page load
document.addEventListener('DOMContentLoaded', renderNavbar);