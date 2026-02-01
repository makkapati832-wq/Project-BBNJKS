// Auth Check
Auth.checkAuth('teacher');

const user = Auth.getUser();

// Global Variables
let myClasses = [];
let qrInterval = null;      // To manage the Rotating QR timer
let currentSessionId = null; // To store active session ID
let currentAttendanceData = []; // To store report data for CSV export

// DOM Elements
const sessionClassSelect = document.getElementById('sessionClassSelect');
const manageClassSelect = document.getElementById('manageClassSelect');
const reportClassSelect = document.getElementById('reportClassSelect');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchMyClasses();
    loadAnalytics(); // NEW: Load charts and stats
});

// --- 1. Analytics & Charts (NEW) ---
async function loadAnalytics() {
    try {
        const { data } = await api.get('/analytics/stats');
        
        // Update Text Stats
        document.getElementById('totalStudents').textContent = data.studentCount;
        document.getElementById('totalClasses').textContent = data.classCount;

        // Render Chart using Chart.js
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        // Check if chart already exists (optional safety)
        if(window.myChart instanceof Chart) {
            window.myChart.destroy();
        }

        window.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Students', 'Classes', 'Recent Sessions'],
                datasets: [{
                    data: [data.studentCount, data.classCount, 5], // 5 is a placeholder or fetch active sessions count
                    backgroundColor: ['#0d6efd', '#198754', '#ffc107'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (err) {
        console.error("Analytics Error", err);
    }
}

// --- 2. Fetch Classes & Populate Dropdowns ---
async function fetchMyClasses() {
    try {
        const { data } = await api.get(`/classes/teacher/${user.id}`);
        myClasses = data;
        populateDropdowns();
    } catch (err) {
        console.error("Error fetching classes", err);
    }
}

function populateDropdowns() {
    const options = '<option value="">-- Select Class --</option>' + 
        myClasses.map(c => `<option value="${c._id}">${c.classCode} - ${c.className}</option>`).join('');
    
    // Populate all dropdowns
    if(sessionClassSelect) sessionClassSelect.innerHTML = options;
    if(manageClassSelect) manageClassSelect.innerHTML = options;
    if(reportClassSelect) reportClassSelect.innerHTML = options;
}

// --- 3. Create Session with DYNAMIC QR (Anti-Cheat) ---
if(sessionClassSelect) {
    sessionClassSelect.addEventListener('change', (e) => {
        const disabled = !e.target.value;
        document.getElementById('sessionName').disabled = disabled;
        document.getElementById('genQrBtn').disabled = disabled;
        if(disabled) document.getElementById('sessionName').value = '';
    });
}

document.getElementById('createSessionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear any existing QR interval (if creating a new session)
    if(qrInterval) clearInterval(qrInterval);

    try {
        const { data } = await api.post("/sessions/create", {
            sessionName: document.getElementById('sessionName').value,
            createdBy: user.name,
            teacherId: user.id,
            classId: sessionClassSelect.value
        });
        
        // Save Session ID
        currentSessionId = data.session._id;
        
        // Update UI
        document.getElementById('sessionResult').classList.remove('d-none');
        document.getElementById('resSessionId').textContent = currentSessionId;
        document.getElementById('sessionName').value = '';

        // START ROTATING QR Logic
        updateQR(); // Run once immediately
        qrInterval = setInterval(updateQR, 900000); // Update every 15 minute

    } catch (err) {
        alert("Failed to create session");
        console.error(err);
    }
});

// Function to generate the Rotating QR Code on Canvas
function updateQR() {
    const canvas = document.getElementById('qrCanvas');
    
    // Create a JSON object with ID and Current Timestamp
    const qrData = JSON.stringify({
        id: currentSessionId,
        ts: Date.now() // This timestamp is checked by the backend
    });

    // Generate QR on Canvas using the library
    QRCode.toCanvas(canvas, qrData, { width: 250, margin: 2 }, function (error) {
        if (error) console.error(error);
    });
}

function copySessionId() {
    const sessionId = document.getElementById("resSessionId").textContent;
    if (!sessionId || sessionId === "...") return;

    navigator.clipboard.writeText(sessionId).then(() => {
        const feedback = document.getElementById("copyFeedback");
        feedback.classList.remove("d-none");

        setTimeout(() => {
            feedback.classList.add("d-none");
        }, 2000);
    });
}


// --- 4. Reports & CSV Export ---
const reportSessionDiv = document.getElementById('reportSessionDiv');
const reportSessionSelect = document.getElementById('reportSessionSelect');
const attendanceListDiv = document.getElementById('attendanceListDiv');
const exportBtn = document.getElementById('exportBtn');

// When Class is selected, fetch Sessions
reportClassSelect.addEventListener('change', async (e) => {
    const classId = e.target.value;
    attendanceListDiv.innerHTML = '';
    reportSessionSelect.innerHTML = '<option value="">Loading...</option>';
    exportBtn.classList.add('d-none'); // Hide export button
    
    if(!classId) {
        reportSessionDiv.classList.add('d-none');
        return;
    }

    try {
        const { data } = await api.get(`/sessions/class/${classId}`);
        reportSessionSelect.innerHTML = '<option value="">-- Select Session --</option>' + 
            data.map(s => `<option value="${s._id}">${s.sessionName} (${new Date(s.createdAt).toLocaleDateString()})</option>`).join('');
        reportSessionDiv.classList.remove('d-none');
    } catch(err) {
        console.error(err);
    }
});

// When Session is selected, fetch Attendance
reportSessionSelect.addEventListener('change', async (e) => {
    const sessionId = e.target.value;
    if(!sessionId) return;

    try {
        const { data } = await api.get(`/attendance/${sessionId}`);
        
        // SAVE DATA GLOBALLY FOR EXPORT
        currentAttendanceData = data; 

        // Show/Hide Export Button
        if(data.length > 0) {
            exportBtn.classList.remove('d-none');
        } else {
            exportBtn.classList.add('d-none');
            attendanceListDiv.innerHTML = '<p class="text-muted">No attendance marked yet.</p>';
            return;
        }

        const html = `
            <h4>Attended Students (${data.length})</h4>
            <ul class="list-group">
                ${data.map(r => `
                    <li class="list-group-item border-start border-4 border-success">
                        <strong>${r.studentName || "Unknown"}</strong> - ${r.studentEmail}
                        <br>
                        <small class="text-secondary">Time: ${new Date(r.createdAt).toLocaleTimeString()}</small>
                    </li>
                `).join('')}
            </ul>
        `;
        attendanceListDiv.innerHTML = html;
    } catch(err) {
        attendanceListDiv.innerHTML = '<p class="text-danger">Error loading data.</p>';
    }
});

// NEW: Export to CSV Function
function exportToCSV() {
    if (currentAttendanceData.length === 0) return alert("No data to export");

    // CSV Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Email,Time Scanned,Date\n";

    // CSV Rows
    currentAttendanceData.forEach(row => {
        const dateObj = new Date(row.createdAt);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString();
        // Escape commas in names if any
        const safeName = row.studentName ? row.studentName.replace(/,/g, "") : "Unknown";
        
        csvContent += `${safeName},${row.studentEmail},${time},${date}\n`;
    });

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
}

// --- 5. Create Class Logic (Standard CRUD) ---
document.getElementById('createClassForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('createClassAlert');
    
    try {
        await api.post("/classes", {
            className: document.getElementById('newClassName').value,
            classCode: document.getElementById('newClassCode').value,
            description: document.getElementById('newClassDesc').value,
            teacherId: user.id
        });
        
        alertBox.textContent = "Class Created Successfully!";
        alertBox.className = "alert alert-success";
        alertBox.classList.remove('d-none');
        e.target.reset();
        fetchMyClasses();
    } catch (err) {
        alertBox.textContent = "Failed to create class.";
        alertBox.className = "alert alert-danger";
        alertBox.classList.remove('d-none');
    }
});

// --- 6. Manage Classes Logic (Standard CRUD) ---
manageClassSelect.addEventListener('change', (e) => {
    const classId = e.target.value;
    const form = document.getElementById('updateClassForm');
    
    if(!classId) {
        form.classList.add('d-none');
        return;
    }
    
    const cls = myClasses.find(c => c._id === classId);
    document.getElementById('updateClassName').value = cls.className;
    document.getElementById('updateClassDesc').value = cls.description || '';
    form.classList.remove('d-none');
});

document.getElementById('updateClassForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = manageClassSelect.value;
    const alertBox = document.getElementById('manageAlert');
    
    try {
        await api.put(`/classes/${id}`, {
            className: document.getElementById('updateClassName').value,
            description: document.getElementById('updateClassDesc').value
        });
        alertBox.textContent = "Class Updated!";
        alertBox.className = "alert alert-success";
        alertBox.classList.remove('d-none');
        fetchMyClasses();
    } catch(err) {
        alert("Update failed");
    }
});

document.getElementById('deleteClassBtn').addEventListener('click', async () => {
    if(!confirm("Are you sure? This cannot be undone.")) return;
    try {
        await api.delete(`/classes/${manageClassSelect.value}`);
        document.getElementById('updateClassForm').classList.add('d-none');
        document.getElementById('manageAlert').textContent = "Class Deleted.";
        document.getElementById('manageAlert').className = "alert alert-danger";
        document.getElementById('manageAlert').classList.remove('d-none');
        fetchMyClasses();
    } catch(err) {
        alert("Delete failed");
    }
});