// admin.js — Lógica del panel administrativo

let allRegistros = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    checkAuth();

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('error-login');
        errorEl.textContent = '';

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                showDashboard();
            } else {
                errorEl.textContent = 'Contraseña incorrecta';
                document.getElementById('password').classList.add('invalid');
            }
        } catch (err) {
            errorEl.textContent = 'Error de conexión';
        }
    });
});

async function checkAuth() {
    try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        if (data.isAdmin) {
            showDashboard();
        }
    } catch (e) {
        // Not logged in, show login
    }
}

async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    await loadRegistros();
}

async function loadRegistros() {
    const loadingMsg = document.getElementById('loadingMsg');
    const noResults = document.getElementById('noResults');
    
    try {
        const res = await fetch('/api/admin/registros');
        if (res.status === 401) {
            // Session expired
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
            return;
        }
        allRegistros = await res.json();
        document.getElementById('totalRegistros').textContent = allRegistros.length;
        renderTable(allRegistros);
        loadingMsg.style.display = 'none';
    } catch (err) {
        loadingMsg.textContent = 'Error al cargar los registros.';
    }
}

function renderTable(registros) {
    const tbody = document.getElementById('registrosBody');
    const noResults = document.getElementById('noResults');
    
    if (registros.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    tbody.innerHTML = registros.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(r.nombre_completo)}</strong></td>
            <td>${formatDate(r.fecha_nacimiento)}</td>
            <td>${formatDate(r.fecha_ingreso)}</td>
            <td>${escapeHtml(r.celular)}</td>
            <td>${escapeHtml(r.telefono_emergencia)}</td>
            <td>${formatDateTime(r.created_at)}</td>
        </tr>
    `).join('');
}

function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = allRegistros.filter(r => 
        r.nombre_completo.toLowerCase().includes(query)
    );
    renderTable(filtered);
}

function exportCSV() {
    window.location.href = '/api/admin/exportar/csv';
}

async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('password').value = '';
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

function formatDateTime(dtStr) {
    if (!dtStr) return '';
    try {
        const d = new Date(dtStr);
        return d.toLocaleDateString('es-MX', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return dtStr;
    }
}
