// js/config.js

// 1. API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Create an Axios instance logic using standard axios via CDN
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include token if user is logged in
api.interceptors.request.use((config) => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
    }
    return config;
});

// 2. Auth Helper Functions
const Auth = {
    getUser: () => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },
    
    login: (userData) => {
        // Normalize ID (handle _id vs id)
        const userWithId = { ...userData, id: userData.id || userData._id };
        localStorage.setItem("user", JSON.stringify(userWithId));
    },

    logout: () => {
        localStorage.removeItem("user");
        window.location.href = 'index.html';
    },

    checkAuth: (requiredRole = null) => {
        const user = Auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        if (requiredRole && user.role !== requiredRole) {
            alert("Unauthorized access");
            window.location.href = user.role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
        }
    }
};

// 3. Render Navbar
function renderNavbar() {
    const user = Auth.getUser();
    const navContainer = document.getElementById('navbar-placeholder');
    
    if (!navContainer) return;

    let linksHtml = '';

    if (user) {
        linksHtml = `
            <span class="navbar-text text-white me-3">Hello, ${user.name}</span>
            <button onclick="Auth.logout()" class="btn btn-danger btn-sm">Logout</button>
        `;
    } else {
        linksHtml = `
            <a href="index.html" class="nav-link text-white">Login</a>
            <a href="register.html" class="nav-link text-white">Register</a>
        `;
    }

    navContainer.innerHTML = `
        <nav class="navbar navbar-dark bg-dark px-4 py-3 mb-4 shadow">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold" href="#">
                     QR Attendance
                </a>
                <div class="d-flex align-items-center">
                    ${linksHtml}
                </div>
            </div>
        </nav>
    `;
}

// 4. Render Footer
function renderFooter() {
    const footerHtml = `
    <footer class="bg-dark text-light py-4 mt-auto border-top border-secondary">
        <div class="container">
            <div class="row align-items-center">
                
                <!-- Column 1: Brand & Copyright -->
                <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                    <h5 class="fw-bold text-primary mb-1">QR Attendance</h5>
                    <small class="text-secondary">
                        &copy; ${new Date().getFullYear()} Student Management System.
                    </small>
                </div>

                <!-- Column 2: Social Links -->
                <div class="col-md-6 text-center text-md-end">
                    <a href="#" class="text-secondary text-decoration-none me-3">Privacy</a>
                    <a href="#" class="text-secondary text-decoration-none me-3">Terms</a>
                    <a href="#" class="text-secondary text-decoration-none">Contact</a>
                </div>

            </div>
        </div>
    </footer>
    `;

    // Create container and append to body
    const div = document.createElement('div');
    div.innerHTML = footerHtml;
    document.body.appendChild(div.firstElementChild);
}

// --- Initialization (UPDATED) ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get current page name from URL
    const path = window.location.pathname;
    const page = path.split("/").pop(); // e.g. "index.html"

    // 2. Define pages where Navbar/Footer should NOT appear
    // '' handles the root path if just opening the folder
    const hideLayoutPages = ['index.html', 'register.html', ''];

    // 3. Only render if the current page is NOT in the exclusion list
    if (!hideLayoutPages.includes(page)) {
        renderNavbar();
        renderFooter();
    }
});