// ==============================
// AUTH CHECK
// ==============================
Auth.checkAuth('admin');
const user = Auth.getUser();

// ==============================
// GLOBAL STATE
// ==============================
let usersCache = [];
let classesCache = [];
let activeSessionClassId = null;
let adminReportData = [];
let adminAttendanceCache = [];

// ==============================
// INIT
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    loadAdminAnalytics();
    loadAllUsers();
    loadAllClasses();
    document.getElementById('userSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderUsers(
        usersCache.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        )
    );
});

});

// ==============================
// 1. ANALYTICS
// ==============================
async function loadAdminAnalytics() {
    try {
        const { data } = await api.get('/analytics/admin-stats');

        document.getElementById('statUsers').textContent = data.userCount;
        document.getElementById('statClasses').textContent = data.classCount;
        document.getElementById('statSessions').textContent = data.sessionCount;

        renderAdminChart(data);
    } catch (err) {
        console.error(err);
    }
}

function renderAdminChart(data) {
    const canvas = document.getElementById('adminActivityChart');
    if (!canvas) return;

    if (window.adminChart) window.adminChart.destroy();

    window.adminChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Users', 'Classes', 'Sessions'],
            datasets: [{
                data: [data.userCount, data.classCount, data.sessionCount],
                backgroundColor: ['#0d6efd', '#198754', '#ffc107']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ==============================
// ALERT HELPERS
// ==============================
function showUsersAlert(msg, type = 'success') {
    const el = document.getElementById('usersAlert');
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3000);
}

function showClassesAlert(msg, type = 'success') {
    const el = document.getElementById('classesAlert');
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 3000);
}

// ==============================
// 2. USERS (SEARCH + EDIT)
// ==============================
async function loadAllUsers() {
    try {
        const { data } = await api.get('/admin/users');
        usersCache = data;
        renderUsers(data);
    } catch {
        document.getElementById('usersTable').innerHTML =
            `<p class="text-danger">Failed to load users.</p>`;
    }
}

function renderUsers(list) {
    const admin = Auth.getUser();

    const rows = list.map(u => `
        <tr>
            <td><input class="form-control form-control-sm"
                id="name-${u._id}" value="${u.name}" disabled></td>
            <td><input class="form-control form-control-sm"
                id="email-${u._id}" value="${u.email}" disabled></td>
            <td class="fw-semibold text-capitalize">${u.role}</td>
            <td class="d-flex gap-2">
                ${
                    u._id === admin.id
                        ? `<span class="text-muted">You</span>`
                        : `
                            <button class="btn btn-sm btn-primary"
                                onclick="enableUserEdit('${u._id}')">Edit</button>
                            <button class="btn btn-sm btn-success d-none"
                                id="save-${u._id}"
                                onclick="saveUser('${u._id}')">Save</button>
                            <button class="btn btn-sm btn-secondary d-none"
                                id="cancel-${u._id}"
                                onclick="cancelUserEdit('${u._id}')">Cancel</button>
                            <button class="btn btn-sm btn-danger"
                                onclick="deleteUser('${u._id}')">Delete</button>
                        `
                }
            </td>
        </tr>
    `).join('');

    document.getElementById('usersTable').innerHTML = `
        <table class="table align-middle">
            <thead>
                <tr class="text-secondary small">
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}


function filterUsers(q) {
    q = q.toLowerCase();
    renderUsers(usersCache.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    ));
}

function enableUserEdit(id) {
    document.getElementById(`name-${id}`).disabled = false;
    document.getElementById(`email-${id}`).disabled = false;
    toggleUserBtns(id, true);
}

function cancelUserEdit(id) {
    const u = usersCache.find(x => x._id === id);
    document.getElementById(`name-${id}`).value = u.name;
    document.getElementById(`email-${id}`).value = u.email;
    document.getElementById(`name-${id}`).disabled = true;
    document.getElementById(`email-${id}`).disabled = true;
    toggleUserBtns(id, false);
}

function toggleUserBtns(id, edit) {
    document.getElementById(`save-${id}`).classList.toggle('d-none', !edit);
    document.getElementById(`cancel-${id}`).classList.toggle('d-none', !edit);
}

async function saveUser(id) {
    try {
        await api.put(`/admin/users/${id}`, {
            name: document.getElementById(`name-${id}`).value.trim(),
            email: document.getElementById(`email-${id}`).value.trim(),
            currentAdminId: user.id
        });
        showUsersAlert('User updated');
        loadAllUsers();
    } catch (err) {
        showUsersAlert(err.response?.data?.message || 'Update failed', 'danger');
        cancelUserEdit(id);
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user permanently?')) return;
    try {
        await api.delete(`/admin/users/${id}`);
        showUsersAlert('User deleted');
        loadAllUsers();
    } catch {
        showUsersAlert('Delete failed', 'danger');
    }
}

// ==============================
// 3. CLASSES + SESSIONS (SEARCH + TOGGLE)
// ==============================
async function loadAllClasses() {
    try {
        const { data } = await api.get('/admin/classes');
        classesCache = data;
        renderClasses(data);
    } catch {
        document.getElementById('classesTable').innerHTML =
            `<p class="text-danger">Failed to load classes.</p>`;
    }
}

function renderClasses(list) {
    const rows = list.map(c => `
        <tr id="class-row-${c._id}">
            <td>${c.classCode}</td>
            <td>
                <input class="form-control form-control-sm"
                    id="class-${c._id}"
                    value="${c.className}" disabled>
            </td>
            <td>${c.teacherId?.name || '—'}</td>
            <td class="d-flex gap-2">
                <button class="btn btn-sm btn-primary"
                    onclick="enableClassEdit('${c._id}')">Edit</button>
                <button class="btn btn-sm btn-success d-none"
                    id="class-save-${c._id}"
                    onclick="saveClass('${c._id}')">Save</button>
                <button class="btn btn-sm btn-secondary d-none"
                    id="class-cancel-${c._id}"
                    onclick="cancelClassEdit('${c._id}')">Cancel</button>
                <button class="btn btn-sm btn-info"
                    onclick="toggleSessions('${c._id}')">
                    Sessions <span id="arrow-${c._id}">▸</span>
                </button>
                <button class="btn btn-sm btn-danger"
                    onclick="deleteClass('${c._id}')">Delete</button>
            </td>
        </tr>
    `).join('');

    document.getElementById('classesTable').innerHTML = `
        <table class="table align-middle">
            <thead>
                <tr class="text-secondary small">
                    <th>Code</th>
                    <th>Name</th>
                    <th>Teacher</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}


function filterClasses(q) {
    q = q.toLowerCase();
    renderClasses(classesCache.filter(c =>
        c.classCode.toLowerCase().includes(q) ||
        c.className.toLowerCase().includes(q) ||
        (c.teacherId?.name || '').toLowerCase().includes(q)
    ));
}

document.getElementById('classSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderClasses(
        classesCache.filter(c =>
            c.classCode.toLowerCase().includes(q) ||
            c.className.toLowerCase().includes(q) ||
            (c.teacherId?.name || '').toLowerCase().includes(q)
        )
    );
});

// ==============================
// CLASS EDIT
// ==============================
function enableClassEdit(id) {
    document.getElementById(`class-${id}`).disabled = false;
    toggleClassBtns(id, true);
}

function cancelClassEdit(id) {
    const c = classesCache.find(x => x._id === id);
    document.getElementById(`class-${id}`).value = c.className;
    document.getElementById(`class-${id}`).disabled = true;
    toggleClassBtns(id, false);
}

function toggleClassBtns(id, edit) {
    document.getElementById(`class-save-${id}`).classList.toggle('d-none', !edit);
    document.getElementById(`class-cancel-${id}`).classList.toggle('d-none', !edit);
}

async function saveClass(id) {
    try {
        await api.put(`/admin/classes/${id}`, {
            className: document.getElementById(`class-${id}`).value.trim()
        });
        showClassesAlert('Class updated');
        loadAllClasses();
    } catch {
        showClassesAlert('Update failed', 'danger');
        cancelClassEdit(id);
    }
}

async function deleteClass(id) {
    if (!confirm('Delete this class and all sessions?')) return;
    try {
        await api.delete(`/admin/classes/${id}`);
        showClassesAlert('Class deleted');
        loadAllClasses();
    } catch {
        showClassesAlert('Delete failed', 'danger');
    }
}




// ==============================
// SESSIONS TOGGLE (FIXED)
// ==============================
async function toggleSessions(classId) {
    // Close others
    document.querySelectorAll("[id^='sessions-']").forEach(r => r.remove());
    document.querySelectorAll("[id^='arrow-']").forEach(a => a.textContent = '▸');

    if (activeSessionClassId === classId) {
        activeSessionClassId = null;
        return;
    }

    activeSessionClassId = classId;
    document.getElementById(`arrow-${classId}`).textContent = '▾';

    const { data } = await api.get(`/admin/classes/${classId}/sessions`);

    const html = `
        <tr id="sessions-${classId}">
            <td colspan="4">
                <div class="mt-3 animate__animated animate__fadeIn">
                    <h6 class="fw-bold mb-2">Sessions</h6>
                    ${
                        data.length === 0
                            ? `<p class="text-muted">No sessions</p>`
                            : data.map(s => `
                                <div class="list-item d-flex justify-content-between align-items-center">
                                    <input class="form-control form-control-sm w-50"
                                        value="${s.sessionName}"
                                        onchange="updateSession('${s._id}', this.value)">
                                    <button class="btn btn-sm btn-danger"
                                        onclick="deleteSession('${s._id}', '${classId}')">
                                        Delete
                                    </button>
                                </div>
                            `).join('')
                    }
                </div>
            </td>
        </tr>
    `;
    document.getElementById(`class-row-${classId}`).insertAdjacentHTML('afterend', html);
}

async function updateSession(id, name) {
    try {
        await api.put(`/admin/sessions/${id}`, { sessionName: name });
        showClassesAlert('Session updated');
    } catch {
        showClassesAlert('Session update failed', 'danger');
    }
}

async function deleteSession(id, classId) {
    try {
        await api.delete(`/admin/sessions/${id}`);
        showClassesAlert('Session deleted');
        toggleSessions(classId);
    } catch {
        showClassesAlert('Delete failed', 'danger');
    }
}

let currentAttendanceData = [];

const reportClassSelect = document.getElementById('reportClassSelect');
const reportSessionSelect = document.getElementById('reportSessionSelect');
const reportSessionDiv = document.getElementById('reportSessionDiv');
const attendanceListDiv = document.getElementById('attendanceListDiv');
const exportBtn = document.getElementById('exportBtn');

// Populate class dropdown (ADMIN = all classes)
function populateReportClasses() {
    if (!reportClassSelect) return;

    reportClassSelect.innerHTML =
        '<option value="">-- Select Class --</option>' +
        classesCache.map(c =>
            `<option value="${c._id}">
                ${c.classCode} - ${c.className}
            </option>`
        ).join('');
}

// Hook into existing class load
const _loadAllClasses = loadAllClasses;
loadAllClasses = async function () {
    await _loadAllClasses();
    populateReportClasses();
};

async function loadTeachersForReports() {
  const { data } = await api.get('/admin/users');
  const teachers = data.filter(u => u.role === 'teacher');

  document.getElementById('reportTeacherSelect').innerHTML =
    '<option value="">-- Select Teacher --</option>' +
    teachers.map(t =>
      `<option value="${t._id}">${t.name}</option>`
    ).join('');
}
loadTeachersForReports();

document.getElementById('reportTeacherSelect').addEventListener('change', async e => {
  const teacherId = e.target.value;

  document.getElementById('attendanceListDiv').innerHTML = '';
  document.getElementById('exportBtn').classList.add('d-none');

  if (!teacherId) return;

  const { data } = await api.get(`/classes/teacher/${teacherId}`);
  adminReportData = data;

  document.getElementById('reportClassSelect').innerHTML =
    '<option value="">-- Select Class --</option>' +
    data.map(c =>
      `<option value="${c._id}">${c.classCode} - ${c.className}</option>`
    ).join('');

  document.getElementById('reportClassDiv').classList.remove('d-none');
  document.getElementById('reportSessionDiv').classList.add('d-none');
});

// When class selected → load sessions
document.getElementById('reportClassSelect').addEventListener('change', async e => {
  const classId = e.target.value;

  if (!classId) return;

  const { data } = await api.get(`/sessions/class/${classId}`);

  document.getElementById('reportSessionSelect').innerHTML =
    '<option value="">-- Select Session --</option>' +
    data.map(s =>
      `<option value="${s._id}">${s.sessionName}</option>`
    ).join('');

  document.getElementById('reportSessionDiv').classList.remove('d-none');
});


// When session selected → load attendance
document.getElementById('reportSessionSelect').addEventListener('change', async e => {
  const sessionId = e.target.value;
  if (!sessionId) return;

  const { data } = await api.get(`/attendance/${sessionId}`);
  adminAttendanceCache = data;

  if (!data.length) {
    document.getElementById('attendanceListDiv').innerHTML =
      `<p class="text-muted">No attendance records found.</p>`;
    return;
  }

  document.getElementById('exportBtn').classList.remove('d-none');

  document.getElementById('attendanceListDiv').innerHTML = `
    <ul class="list-group">
      ${data.map(a => `
        <li class="list-group-item">
          <strong>${a.studentName || 'Unknown'}</strong><br>
          ${a.studentEmail}<br>
          <small class="text-muted">
            ${new Date(a.createdAt).toLocaleString()}
          </small>
        </li>
      `).join('')}
    </ul>
  `;
});


// CSV Export (same as teacher)
document.getElementById('exportBtn').addEventListener('click', () => {
  if (!adminAttendanceCache.length) return;

  let csv = 'Name,Email,Date,Time\n';

  adminAttendanceCache.forEach(r => {
    const d = new Date(r.createdAt);
    csv += `"${r.studentName || ''}","${r.studentEmail}","${d.toLocaleDateString()}","${d.toLocaleTimeString()}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'attendance_report.csv';
  link.click();
});
