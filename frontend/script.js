/* === SMART EXPENSE TRACKER — FRONTEND JS === */

const API_URL = `${window.location.origin}/api`;

// Categories
const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Business', 'Investment', 'Rental Income', 'Gift', 'Bonus', 'Other Income'],
  expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Education', 'Utilities', 'Housing', 'Travel', 'Personal Care', 'Insurance', 'EMI/Loan', 'Other Expense']
};

const CATEGORY_ICONS = {
  income: '↑', expense: '↓'
};

// State
let currentType = 'expense';
let transactions = [];
let pieChart = null;
let barChart = null;
let expenseCatChart = null;
let incomeCatChart = null;
let trendChart = null;
let reportTransactions = [];

// === AUTH ===
function getToken() { return sessionStorage.getItem('token'); }
function getUser() { return JSON.parse(sessionStorage.getItem('user') || 'null'); }
function toggleAuth(mode) {
  document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = mode === 'register' ? 'block' : 'none';
}

async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');
  errEl.textContent = '';

  if (!name || !email || !password) { errEl.textContent = 'Please fill all fields'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; return; }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      initApp();
    } else {
      errEl.textContent = data.message;
    }
  } catch (e) {
    errEl.textContent = 'Connection failed. Is the server running?';
  }
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) { errEl.textContent = 'Please fill all fields'; return; }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      initApp();
    } else {
      errEl.textContent = data.message;
    }
  } catch (e) {
    errEl.textContent = 'Connection failed. Is the server running?';
  }
}

function logout() {
  sessionStorage.clear();
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
}

// === APP INIT ===
function initApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';

  const user = getUser();
  if (user) {
    const initial = user.name ? user.name[0].toUpperCase() : 'U';
    document.getElementById('user-avatar').textContent = initial;
    document.getElementById('sidebar-user-name').textContent = user.name;
  }

  updateDate();
  loadTransactions();
  loadDashboard();
}

function updateDate() {
  const now = new Date();
  document.getElementById('date-display').textContent = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

// === NAVIGATION ===
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`page-${name}`).classList.add('active');
  document.querySelector(`[data-page="${name}"]`).classList.add('active');
  document.getElementById('page-title').textContent = name.charAt(0).toUpperCase() + name.slice(1);

  if (name === 'dashboard') loadDashboard();
  if (name === 'transactions') loadTransactions();
  if (name === 'analytics') {
 	 window.scrollTo(0, 0);  // 🔥 ADD THIS
  	loadAnalytics();
}
  if (name === 'reports') loadReport();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// === API HELPERS ===
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401) { logout(); return null; }
  return res.json();
}

// === DASHBOARD ===
async function loadDashboard() {
  const data = await apiFetch('/transactions');
  if (!data || !data.success) return;

  transactions = data.data;
  const { totalIncome, totalExpense, balance } = data;

  document.getElementById('dash-income').textContent = fmt(totalIncome);
  document.getElementById('dash-expense').textContent = fmt(totalExpense);
  document.getElementById('dash-balance').textContent = fmt(balance);

  const trend = balance >= 0 ? '▲ Positive balance' : '▼ Negative balance';
  document.getElementById('dash-balance-trend').textContent = trend;

  renderPieChart(totalIncome, totalExpense);
  renderBarChart(transactions);
  renderRecentList(transactions.slice(0, 6));
}

function renderPieChart(income, expense) {
  const ctx = document.getElementById('pie-chart');
  if (pieChart) pieChart.destroy();

  if (income === 0 && expense === 0) {
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    return;
  }

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['rgba(0,229,160,0.85)', 'rgba(255,79,109,0.85)'],
        borderColor: ['rgba(0,229,160,1)', 'rgba(255,79,109,1)'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
  	responsive: true,
  	maintainAspectRatio: false, // 🔥 FIX
  	animation: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9090a8', font: { size: 12, family: 'DM Sans' }, padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          }
        }
      },
      cutout: '65%'
    }
  });
}

function renderBarChart(txs) {
  const ctx = document.getElementById('bar-chart');
  if (barChart) barChart.destroy();

  const months = {};
  txs.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    months[key][t.type] += t.amount;
  });

  const sorted = Object.keys(months).sort().slice(-6);
  const labels = sorted.map(k => {
    const [y, m] = k.split('-');
    return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  });

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: sorted.map(k => months[k].income),
          backgroundColor: 'rgba(0,229,160,0.7)',
          borderRadius: 6
        },
        {
          label: 'Expense',
          data: sorted.map(k => months[k].expense),
          backgroundColor: 'rgba(255,79,109,0.7)',
          borderRadius: 6
        }
      ]
    },
    options: {
  	responsive: true,
  	maintainAspectRatio: false,
  	animation: false,   // 🔥 ADD THIS
      plugins: {
        legend: { labels: { color: '#9090a8', font: { family: 'DM Sans', size: 12 } } }
      },
      scales: {
        x: { ticks: { color: '#5a5a70' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          ticks: { color: '#5a5a70', callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

function renderRecentList(txs) {
  const el = document.getElementById('recent-list');
  if (!txs.length) { el.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:16px 0">No transactions yet</p>'; return; }

  el.innerHTML = txs.map(t => `
    <div class="recent-item">
      <div class="recent-dot ${t.type}"></div>
      <div class="recent-info">
        <div class="recent-title">${escHtml(t.title)}</div>
        <div class="recent-cat">${escHtml(t.category)}</div>
      </div>
      <div class="recent-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
    </div>
  `).join('');
}

// === TRANSACTIONS PAGE ===
async function loadTransactions() {
  const type = document.getElementById('filter-type')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const monthVal = document.getElementById('filter-month')?.value || '';

  let query = '';
  if (type) query += `type=${type}&`;
  if (category) query += `category=${encodeURIComponent(category)}&`;
  if (monthVal) {
    const [y, m] = monthVal.split('-');
    query += `month=${m}&year=${y}&`;
  }

  const data = await apiFetch(`/transactions?${query}`);
  if (!data || !data.success) return;

  transactions = data.data;

  // Update filter categories
  const cats = [...new Set(transactions.map(t => t.category))].sort();
  const catSel = document.getElementById('filter-category');
  if (catSel) {
    const cur = catSel.value;
    catSel.innerHTML = '<option value="">All Categories</option>' +
      cats.map(c => `<option value="${c}" ${c === cur ? 'selected' : ''}>${c}</option>`).join('');
  }

  document.getElementById('t-income').textContent = fmt(data.totalIncome);
  document.getElementById('t-expense').textContent = fmt(data.totalExpense);
  document.getElementById('t-balance').textContent = fmt(data.balance);
  document.getElementById('t-count').textContent = data.count;

  renderTransactionList(transactions);
}

function renderTransactionList(txs) {
  const list = document.getElementById('transaction-list');
  const empty = document.getElementById('no-transactions');

  if (!txs.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = txs.map((t, i) => `
    <div class="tx-item" id="tx-${t._id}">
      <div class="tx-type-icon ${t.type}">${t.type === 'income' ? '↑' : '↓'}</div>
      <div class="tx-info">
        <div class="tx-title">${escHtml(t.title)}</div>
        <div class="tx-meta">${t.note ? escHtml(t.note) : ''}</div>
      </div>
      <span class="tx-category">${escHtml(t.category)}</span>
      <span class="tx-date">${fmtDate(t.date)}</span>
      <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
      <button class="tx-delete" onclick="deleteTransaction('${t._id}')" title="Delete">✕</button>
    </div>
  `).join('');
}

function clearFilters() {
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-month').value = '';
  loadTransactions();
}

async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  const data = await apiFetch(`/transactions/delete/${id}`, { method: 'DELETE' });
  if (data && data.success) {
    showToast('Transaction deleted', 'success');
    const el = document.getElementById(`tx-${id}`);
    if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 300); }
    loadTransactions();
    loadDashboard();
  } else {
    showToast(data?.message || 'Delete failed', 'error');
  }
}

// === MODAL ===
function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  selectType(currentType);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('transaction-form').reset();
  document.getElementById('form-error').textContent = '';
}

function selectType(type) {
  currentType = type;
  document.getElementById('type-income').classList.toggle('active', type === 'income');
  document.getElementById('type-expense').classList.toggle('active', type === 'expense');

  const catSel = document.getElementById('tx-category');
  const cats = CATEGORIES[type];
  catSel.innerHTML = '<option value="">Select category</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function setChartFilter(filter, btn) {
  document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  if (filter === 'month') {
    const now = new Date();
    const monthly = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const inc = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    renderPieChart(inc, exp);
  } else {
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    renderPieChart(inc, exp);
  }
}

async function submitTransaction(e) {
  e.preventDefault();
  const errEl = document.getElementById('form-error');
  errEl.textContent = '';

  const payload = {
    title: document.getElementById('tx-title').value.trim(),
    amount: parseFloat(document.getElementById('tx-amount').value),
    type: currentType,
    category: document.getElementById('tx-category').value,
    date: document.getElementById('tx-date').value,
    note: document.getElementById('tx-note').value.trim()
  };

  if (!payload.title || !payload.amount || !payload.category || !payload.date) {
    errEl.textContent = 'Please fill all required fields';
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  const data = await apiFetch('/transactions/add', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  btn.textContent = 'Add Transaction';
  btn.disabled = false;

  if (data && data.success) {
    showToast('Transaction added!', 'success');
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('transaction-form').reset();
    loadTransactions();
    loadDashboard();
  } else {
    errEl.textContent = data?.message || 'Failed to add transaction';
  }
}

// === ANALYTICS ===
async function loadAnalytics() {
  const expData = await apiFetch('/transactions/categories?type=expense');
  const incData = await apiFetch('/transactions/categories?type=income');

  if (expData?.success) renderCategoryChart('expense-category-chart', expData.data, 'Expense Categories', 'expense', expenseCatChart, c => expenseCatChart = c);
  if (incData?.success) renderCategoryChart('income-category-chart', incData.data, 'Income Categories', 'income', incomeCatChart, c => incomeCatChart = c);

  const allData = await apiFetch('/transactions');
  if (allData?.success) renderTrendChart(allData.data);
}

function renderCategoryChart(canvasId, cats, label, type, chartRef, setter) {
  const ctx = document.getElementById(canvasId);
  if (chartRef) chartRef.destroy();

  const colors = type === 'expense'
    ? ['#ff4f6d','#ff7a8a','#ff9faa','#ffbfc7','#ffd9df','#ffe5e9']
    : ['#00e5a0','#33ebaf','#66f0bf','#99f5cf','#bbf7de','#ddfaee'];

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c._id),
      datasets: [{
        data: cats.map(c => c.total),
        backgroundColor: colors.slice(0, cats.length),
        borderColor: 'transparent',
        hoverOffset: 6
      }]
    },
    options: {
  	responsive: true,
  	maintainAspectRatio: false,
  	animation: false,   // 🔥 ADD THIS
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9090a8', font: { size: 11, family: 'DM Sans' }, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
          }
        }
      },
      cutout: '55%'
    }
  });
  setter(chart);
}

function renderTrendChart(txs) {
  const ctx = document.getElementById('trend-chart');
  if (trendChart) trendChart.destroy();

  const months = {};
  txs.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    months[key][t.type] += t.amount;
  });

  const sorted = Object.keys(months).sort().slice(-6);
  const labels = sorted.map(k => {
    const [y, m] = k.split('-');
    return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short' });
  });

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: sorted.map(k => months[k].income),
          borderColor: 'rgba(0,229,160,1)',
          backgroundColor: 'rgba(0,229,160,0.08)',
          tension: 0.4, fill: true, pointRadius: 5,
          pointBackgroundColor: 'rgba(0,229,160,1)'
        },
        {
          label: 'Expense',
          data: sorted.map(k => months[k].expense),
          borderColor: 'rgba(255,79,109,1)',
          backgroundColor: 'rgba(255,79,109,0.08)',
          tension: 0.4, fill: true, pointRadius: 5,
          pointBackgroundColor: 'rgba(255,79,109,1)'
        }
      ]
    },
    options: {
  	responsive: true,
  	maintainAspectRatio: false,
  	animation: false,   // 🔥 ADD THIS
      plugins: {
        legend: { labels: { color: '#9090a8', font: { family: 'DM Sans', size: 12 } } }
      },
      scales: {
        x: { ticks: { color: '#5a5a70' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: {
          ticks: { color: '#5a5a70', callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

// === REPORTS ===
async function loadReport() {
  const start = document.getElementById('report-start')?.value;
  const end = document.getElementById('report-end')?.value;

  let query = '';
  if (start && end) query = `startDate=${start}&endDate=${end}`;

  const data = await apiFetch(`/transactions?${query}`);
  if (!data || !data.success) return;

  reportTransactions = data.data;

  document.getElementById('r-income').textContent = fmt(data.totalIncome);
  document.getElementById('r-expense').textContent = fmt(data.totalExpense);
  document.getElementById('r-balance').textContent = fmt(data.balance);
  document.getElementById('r-count').textContent = data.count;

  const period = start && end
    ? `${fmtDate(start)} to ${fmtDate(end)}`
    : 'Full History';
  document.getElementById('report-period').textContent = `Period: ${period}`;

  const tbody = document.getElementById('report-tbody');
  tbody.innerHTML = reportTransactions.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${fmtDate(t.date)}</td>
      <td>${escHtml(t.title)}</td>
      <td>${escHtml(t.category)}</td>
      <td><span class="badge ${t.type}">${t.type}</span></td>
      <td style="color:var(--${t.type});font-weight:600">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
    </tr>
  `).join('');
}

function printReport() {
  window.print();
}

function downloadPDF() {
  const el = document.getElementById('report-content');
  const opt = {
    margin: 12,
    filename: `expense-report-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Temporarily style for print
  const original = el.style.cssText;
  el.style.background = '#ffffff';
  el.style.color = '#000000';
  el.style.padding = '20px';

  html2pdf().set(opt).from(el).save().then(() => {
    el.style.cssText = original;
    showToast('PDF downloaded!', 'success');
  });
}

function downloadCSV() {
  if (!reportTransactions.length) { showToast('No data to export', 'error'); return; }

  const headers = ['#', 'Date', 'Title', 'Category', 'Type', 'Amount (₹)', 'Note'];
  const rows = reportTransactions.map((t, i) => [
    i + 1,
    fmtDate(t.date),
    `"${t.title}"`,
    t.category,
    t.type,
    t.amount.toFixed(2),
    `"${t.note || ''}"`
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expense-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported!', 'success');
}

// === UTILITIES ===
function fmt(n) {
  return '₹' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (token) {
    initApp();
  }

  // Allow Enter key in auth forms
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
  document.getElementById('reg-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') register();
  });
});
