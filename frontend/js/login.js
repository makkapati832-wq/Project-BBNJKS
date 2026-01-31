document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const errorAlert = document.getElementById('error-alert');

    // UI Loading State
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    errorAlert.classList.add('d-none');

    try {
        const { data } = await api.post('/auth/login', { email, password });
        
        // Save user
        Auth.login(data.user);

        // Redirect based on role
        if (data.user.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else if (data.user.role === 'student'){
            window.location.href = 'student-dashboard.html';
        } else {
            window.location.href = 'admin-dashboard.html';
        }
    } catch (err) {
        errorAlert.textContent = err.response?.data?.message || "Invalid credentials";
        errorAlert.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
});