document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    const btn = document.getElementById('regBtn');
    const alertBox = document.getElementById('alert-box');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating Account...';
    alertBox.className = 'alert d-none';

    try {
        await api.post('/auth/register', formData);
        
        alertBox.className = 'alert alert-success';
        alertBox.textContent = "Registration Successful! Redirecting to login...";
        alertBox.classList.remove('d-none');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = err.response?.data?.message || "Registration failed";
        alertBox.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        if(alertBox.classList.contains('alert-danger')) {
            btn.textContent = 'Create Account';
        }
    }
});