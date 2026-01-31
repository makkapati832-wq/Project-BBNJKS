// Auth Check
Auth.checkAuth('student');

const user = Auth.getUser();
// Safely set welcome message if element exists
const welcomeMsg = document.getElementById('welcomeMsg');
if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${user.name}`;

// --- 1. Fetch Classes (Updated: WRAPPED TEXT SUPPORT) ---
async function loadClasses(query = '') {
    const listDiv = document.getElementById('classesList');
    
    // Bootstrap Loading Spinner
    listDiv.innerHTML = `
        <div class="d-flex justify-content-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>`;

    try {
        const url = query ? `/classes?search=${query}` : "/classes";
        const { data } = await api.get(url);
        
        if (data.length === 0) {
            listDiv.innerHTML = `
                <div class="alert alert-light text-center border" role="alert">
                    <span class="text-muted">No classes found.</span>
                </div>`;
            return;
        }

        // --- UPDATED: ALLOW TEXT WRAPPING ---
        const html = data.map(cls => `
            <!-- Card with Full Text Wrapping -->
            <div class="card mb-3 shadow-sm border-0 border-start border-4 border-primary">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        
                        <!-- Left: Title & Description -->
                        <!-- Removed 'text-truncate' so text can wrap -->
                        <div class="pe-3" style="min-width: 0;"> 
                            <h6 class="fw-bold mb-1 text-dark">${cls.className}</h6>
                            <p class="text-muted small mb-0" style="white-space: normal; line-height: 1.4;">
                                ${cls.description || 'No description'}
                            </p>
                        </div>

                        <!-- Right: Class Code Badge -->
                        <!-- Added flex-shrink-0 so badge doesn't get squashed -->
                        <div class="flex-shrink-0">
                            <span class="badge bg-primary rounded-pill px-3 py-2">
                                ${cls.classCode || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
            
        listDiv.innerHTML = html;

    } catch (err) {
        console.error(err);
        listDiv.innerHTML = `<div class="alert alert-danger text-center">Failed to fetch classes</div>`;
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => loadClasses());

// Search Listener
let searchTimeout;
document.getElementById('classSearchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadClasses(e.target.value);
    }, 300);
});

// --- 2. Shared Attendance Submission Logic (UNTOUCHED) ---
async function submitAttendance(sessionId, timestamp = null) {
    const statusDiv = document.getElementById('statusMsg');
    statusDiv.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span> <span class="text-muted">Marking...</span>';

    try {
        await api.post("/attendance/mark", {
            studentId: user.id,
            sessionId: sessionId,
            timestamp: timestamp
        });
        
        statusDiv.innerHTML = '<div class="alert alert-success py-2">✅ Attendance Marked Successfully!</div>';
        document.getElementById('sessionIdInput').value = ''; 
    } catch (err) {
        let msg = "Failed to mark attendance.";
        if (err.response) {
            if (err.response.status === 400) msg = err.response.data.message;
            else msg = err.response.data.message || msg;
        }
        statusDiv.innerHTML = `<div class="alert alert-danger py-2">❌ ${msg}</div>`;
    }
}

// Manual Form Submit Handler
document.getElementById('attendanceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const sessionId = document.getElementById('sessionIdInput').value.trim();
    submitAttendance(sessionId, null);
});

// --- 3. QR Scanner Logic (UNTOUCHED) ---
let html5QrCode = null;

function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    const scanBtn = document.getElementById('scanBtn');

    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
            readerDiv.style.display = 'none';
            scanBtn.innerHTML = `<span>📷</span> Scan QR`;
            scanBtn.classList.remove('btn-danger');
            scanBtn.classList.add('btn-outline-secondary');
        }).catch(err => console.error(err));
        return;
    }

    readerDiv.style.display = 'block';
    scanBtn.innerHTML = `<span>⏹</span> Stop Camera`;
    scanBtn.classList.remove('btn-outline-secondary');
    scanBtn.classList.add('btn-danger');

    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess, 
        (errorMessage) => { }
    );
}

function onScanSuccess(decodedText) {
    try {
        const data = JSON.parse(decodedText);
        if (data.id && data.ts) {
            document.getElementById('sessionIdInput').value = data.id;
            submitAttendance(data.id, data.ts);
            toggleScanner();
            return;
        }
    } catch (e) {
        if (decodedText.startsWith("SESSION:")) {
            const sessionId = decodedText.split(":")[1];
            document.getElementById('sessionIdInput').value = sessionId;
            submitAttendance(sessionId, null);
            toggleScanner();
        }
    }
}