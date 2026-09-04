// SalesOS Shared App Shell & Client Library
const SalesOS = {
  currentUser: { id: 'usr-1', name: 'Arjun Sharma', role: 'Owner', email: 'arjun@acmecloud.com', tenant_id: 'tenant-1' },
  tenant: { id: 'tenant-1', name: 'Acme Cloud', plan: 'Enterprise SaaS', currency: 'NPR' },

  routes: [
    { label: 'Dashboard', path: '/index.html', icon: '▦', section: 'Workspace' },
    { label: 'Inbox', path: '/inbox.html', icon: '☵', section: 'Workspace', badge: '12', badgeClass: 'badge-blue' },
    { label: 'Leads', path: '/leads.html', icon: '♙', section: 'Workspace' },
    { label: 'Contacts', path: '/contacts.html', icon: '◉', section: 'Workspace' },
    { label: 'Companies', path: '/companies.html', icon: '▱', section: 'Workspace' },
    { label: 'Deals', path: '/deals.html', icon: '◇', section: 'Revenue Pipeline' },
    { label: 'Quotes', path: '/quotes.html', icon: '📄', section: 'Revenue Pipeline' },
    { label: 'Products', path: '/products.html', icon: '▤', section: 'Revenue Pipeline' },
    { label: 'Tasks', path: '/tasks.html', icon: '✓', section: 'Revenue Pipeline' },
    { label: 'Campaigns', path: '/campaigns.html', icon: '◌', section: 'Autonomous AI' },
    { label: 'AI Agents & Approvals', path: '/approvals.html', icon: '✦', section: 'Autonomous AI', badge: '3', badgeClass: 'badge-orange' },
    { label: 'Automations', path: '/automations.html', icon: '⚙', section: 'Autonomous AI' },
    { label: 'Reports', path: '/reports.html', icon: '▥', section: 'Analytics & Manage' },
    { label: 'Settings', path: '/settings.html', icon: '⚙', section: 'Analytics & Manage' },
  ],

  init(activeRouteName, breadcrumbs = []) {
    this.initTheme();
    this.checkSession();
    this.renderSidebar(activeRouteName);
    this.renderTopbar(breadcrumbs);
    this.renderModals();
    this.setupGlobalEvents();
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  },

  renderSidebar(activeRouteName) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const currentPath = window.location.pathname;

    let html = `
      <a href="/index.html" class="brand">
        <div class="brand-mark">✦</div>
        <div class="brand-text">
          <span>SalesOS</span>
          <span class="brand-badge">AI-FIRST OS</span>
        </div>
      </a>

      <div class="tenant-badge" onclick="location.href='/settings.html'" title="Switch or edit workspace">
        <div class="tenant-avatar">${(this.tenant.name || 'AC').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
        <div class="tenant-info">
          <strong>${this.escapeHtml(this.tenant.name || 'Workspace')}</strong>
          <small><span class="tenant-pulse-dot"></span> ${this.escapeHtml(this.tenant.plan || 'Enterprise')} · ${this.escapeHtml(this.tenant.currency || 'USD')}</small>
        </div>
        <span style="color:#94a3b8;font-size:12px">⌄</span>
      </div>

      <nav class="nav-links">
    `;

    let currentSection = '';
    this.routes.forEach(route => {
      if (route.section !== currentSection) {
        currentSection = route.section;
        html += `<div class="nav-section-label" style="margin-top:${currentSection === 'Workspace' ? '0' : '14px'}">${currentSection}</div>`;
      }

      // Check if this route is currently active
      const isActive = activeRouteName === route.label || 
        currentPath === route.path || 
        (route.path === '/index.html' && (currentPath === '/' || currentPath === ''));

      html += `
        <a href="${route.path}" class="nav-item ${isActive ? 'active' : ''}" id="nav-${route.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">
          <span class="nav-icon">${route.icon}</span>
          <span>${route.label}</span>
          ${route.badge ? `<span class="nav-badge ${route.badgeClass || ''}">${route.badge}</span>` : ''}
        </a>
      `;
    });

    html += `
      </nav>
      <div class="sidebar-footer">
        <div class="agent-mini-card">
          <b>✦ Autonomous Sales Engine</b>
          <p>Handled 68% of inbound conversations autonomously this week.</p>
          <a href="/approvals.html">Review AI actions →</a>
        </div>
        <a href="/onboarding.html" class="nav-item" style="color:var(--blue);font-weight:600">
          <span class="nav-icon">✨</span>
          <span>12-Step Setup Wizard</span>
        </a>
        <a href="/settings.html" class="nav-item" style="color:var(--muted)">
          <span class="nav-icon">⚙</span>
          <span>Workspace Settings</span>
        </a>
        <a href="/superadmin.html" class="nav-item" style="color:#a855f7;font-weight:600">
          <span class="nav-icon">⚡</span>
          <span>Platform Superadmin</span>
        </a>
      </div>
    `;

    sidebar.innerHTML = html;
  },

  renderTopbar(breadcrumbs = []) {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    let crumbsHtml = breadcrumbs.map((b, i) => {
      if (i === breadcrumbs.length - 1) {
        return `<span style="color:var(--ink);font-weight:700">${b.label || b}</span>`;
      }
      return `<a href="${b.href || '#'}" style="color:var(--muted);text-decoration:none">${b.label || b}</a> <span style="color:#cbd5e1;margin:0 4px">/</span> `;
    }).join('');

    topbar.innerHTML = `
      <button class="menu-toggle" id="menuToggle" title="Toggle Navigation" onclick="SalesOS.toggleSidebar()">☰</button>
      <div class="breadcrumbs">${crumbsHtml || '<span>SalesOS</span>'}</div>
      
      <div class="topbar-actions">
        <div class="live-status-pill">
          <span class="pulse-dot"></span>
          <span>Connected</span>
        </div>

        <div class="global-search">
          <span class="search-icon">⌕</span>
          <input type="text" id="globalSearchInput" placeholder="Search leads, deals, contacts..." onkeydown="SalesOS.handleGlobalSearch(event)" />
          <span class="search-shortcut">⌘K</span>
        </div>

        <div style="position:relative">
          <button class="btn btn-primary btn-sm" onclick="SalesOS.toggleQuickCreate(event)" style="font-size:12px;gap:5px;padding:6.5px 12px">
            <span>＋ Quick Create</span>
            <span style="font-size:9px">⌄</span>
          </button>
          <div class="user-dropdown" id="quickCreateMenu" style="right:0;top:38px;width:180px">
            <a href="/leads.html?action=new">♙ New Lead</a>
            <a href="/deals.html?action=new">◇ New Deal</a>
            <a href="/quotes.html?action=new">📄 New Quote</a>
            <a href="/tasks.html?action=new">✓ New Task</a>
          </div>
        </div>

        <button class="btn-icon" title="WebRTC Softphone Dialer" id="btnToggleSoftphone" onclick="SalesOS.toggleSoftphone()" style="position:relative">
          <span>📞</span>
        </button>

        <button class="btn-icon" title="Toggle Light / Dark Theme" id="btnThemeToggle" onclick="SalesOS.toggleTheme()" style="position:relative;font-size:14px">
          <span id="themeToggleIcon">🌙</span>
        </button>

        <button class="btn-icon" title="Notifications" onclick="SalesOS.showToast('All systems operational. 3 AI actions pending review.', 'info')">
          <span>🔔</span>
          <span class="dot-badge"></span>
        </button>

        <div class="user-profile" id="userProfileBtn" onclick="SalesOS.toggleUserDropdown(event)">
          <div class="user-avatar" id="userAvatarInitials">${(this.currentUser?.name || 'AS').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
          <div class="user-meta">
            <strong id="topbarUserName">${this.escapeHtml(this.currentUser?.name || 'User')}</strong>
            <small id="topbarUserRole">${this.escapeHtml(this.currentUser?.role || 'owner')}</small>
          </div>
          <span style="color:#94a3b8;font-size:11px">⌄</span>

          <div class="user-dropdown" id="userDropdownMenu">
            <div style="padding:8px 12px;border-bottom:1px solid var(--line);margin-bottom:4px">
              <strong style="font-size:12px;display:block" id="dropdownEmail">${this.escapeHtml(this.currentUser?.email || '')}</strong>
              <span class="badge badge-blue" style="font-size:10px;margin-top:4px" id="dropdownRole">${this.escapeHtml(this.currentUser?.role || 'owner')}</span>
            </div>
            <a href="/settings.html">👤 Workspace Settings</a>
            <a href="/approvals.html">✦ AI Guardrails</a>
            <a href="/superadmin.html" style="color:#a855f7;font-weight:600">⚡ Superadmin Control Plane</a>
            <button onclick="SalesOS.logout()" style="color:var(--red)">🚪 Sign Out</button>
          </div>
        </div>
      </div>
    `;
  },

  renderModals() {
    let container = document.getElementById('salesos-modals');
    if (!container) {
      container = document.createElement('div');
      container.id = 'salesos-modals';
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="modal-overlay" id="loginModal">
        <div class="modal-box" style="max-width:400px">
          <div class="modal-header">
            <div class="brand" style="padding:0">
              <div class="brand-mark" style="width:28px;height:28px;font-size:14px">✦</div>
              <span style="font-size:16px">Sign In to SalesOS</span>
            </div>
            <button class="modal-close" onclick="SalesOS.closeModal('loginModal')">×</button>
          </div>
          <div class="modal-body">
            <p style="color:var(--muted);font-size:13px;margin-bottom:16px">Enter your credentials to access your tenant workspace.</p>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="loginEmail" class="form-control" placeholder="arjun@acmecloud.com" value="arjun@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="loginPassword" class="form-control" placeholder="••••••••" value="secret">
            </div>
            <div id="loginError" style="color:var(--red);font-size:12px;min-height:18px;margin-bottom:8px"></div>
            <button class="btn btn-primary" style="width:100%" onclick="SalesOS.submitLogin()">Sign In</button>
          </div>
        </div>
      </div>

      <!-- In-App WebRTC Softphone Dialer Widget -->
      <div class="softphone-widget" id="softphoneWidget">
        <div class="softphone-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:14px">📞</span>
            <strong style="font-size:13px;letter-spacing:0.3px">WebRTC Softphone</strong>
            <span class="badge badge-green" id="softphoneStatusBadge" style="font-size:9px">READY</span>
          </div>
          <button onclick="SalesOS.toggleSoftphone()" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer">&times;</button>
        </div>
        <div class="softphone-body">
          <div class="softphone-screen">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:10px;color:#94a3b8;text-transform:uppercase" id="softphoneCallerLabel">Direct Outbound</span>
              <span class="call-timer" id="softphoneTimer" style="display:none">00:00</span>
            </div>
            <input type="text" id="softphoneInput" placeholder="+977 9800000000" />
          </div>

          <div class="softphone-dialpad">
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('1')">1 <span>&nbsp;</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('2')">2 <span>ABC</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('3')">3 <span>DEF</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('4')">4 <span>GHI</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('5')">5 <span>JKL</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('6')">6 <span>MNO</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('7')">7 <span>PQRS</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('8')">8 <span>TUV</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('9')">9 <span>WXYZ</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('*')">* <span>&nbsp;</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('0')">0 <span>+</span></button>
            <button class="dial-btn" onclick="SalesOS.appendDialDigit('#')"># <span>&nbsp;</span></button>
          </div>

          <div style="display:flex;gap:10px;margin-top:6px">
            <button class="btn btn-secondary" style="flex:1;background:#1e293b;border-color:rgba(255,255,255,0.1);color:#94a3b8" onclick="SalesOS.clearDialDigit()">⌫</button>
            <button class="btn btn-primary" id="softphoneActionBtn" style="flex:3;background:#10b981;border-color:#10b981" onclick="SalesOS.handleSoftphoneAction()">
              📞 Call Now
            </button>
          </div>
        </div>
      </div>

      <div class="toast-container" id="toastContainer"></div>
    `;
  },

  setupGlobalEvents() {
    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('userDropdownMenu');
      const profileBtn = document.getElementById('userProfileBtn');
      if (dropdown && profileBtn && !profileBtn.contains(e.target)) {
        dropdown.classList.remove('show');
      }

      const quickMenu = document.getElementById('quickCreateMenu');
      const quickBtn = e.target.closest && e.target.closest('button');
      if (quickMenu && (!quickBtn || !quickBtn.textContent.includes('Quick Create'))) {
        quickMenu.classList.remove('show');
      }
    });

    // Global keyboard shortcut: Ctrl+K or Cmd+K focuses search
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const search = document.getElementById('globalSearchInput');
        if (search) {
          search.focus();
          search.select();
        }
      }
    });
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  },

  toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) dropdown.classList.toggle('show');
  },

  toggleQuickCreate(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('quickCreateMenu');
    if (menu) menu.classList.toggle('show');
  },

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span style="font-weight:bold;color:${type === 'error' ? 'var(--red)' : 'var(--green)'}">${icon}</span> <span>${SalesOS.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  async checkSession() {
    const path = window.location.pathname;
    const isPublicPage = path.endsWith('/login.html') ||
                         path.endsWith('/quote-view.html') ||
                         path.endsWith('/404.html');
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          this.currentUser = data.user;
          if (data.tenant) this.tenant = data.tenant;
          this.updateUserUI();
          this.updateTenantUI();
        }
      } else if (res.status === 401 && !isPublicPage) {
        window.location.href = `/login.html?redirect=${encodeURIComponent(path + window.location.search)}`;
      }
    } catch (e) {
      if (!isPublicPage) {
        window.location.href = '/login.html';
      }
    }
  },

  updateTenantUI() {
    const nameEl = document.querySelector('.tenant-info strong');
    const planEl = document.querySelector('.tenant-info small');
    const avatarEl = document.querySelector('.tenant-avatar');
    if (nameEl && this.tenant.name) nameEl.textContent = this.tenant.name;
    if (planEl && this.tenant.plan) planEl.textContent = `${this.tenant.plan} · ${this.tenant.currency || 'NPR'}`;
    if (avatarEl && this.tenant.name) {
      avatarEl.textContent = this.tenant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
  },

  updateUserUI() {
    const nameEl = document.getElementById('topbarUserName');
    const roleEl = document.getElementById('topbarUserRole');
    const avatarEl = document.getElementById('userAvatarInitials');
    const dropEmail = document.getElementById('dropdownEmail');
    const dropRole = document.getElementById('dropdownRole');

    if (nameEl) nameEl.textContent = this.currentUser.name;
    if (roleEl) roleEl.textContent = this.currentUser.role;
    if (dropEmail) dropEmail.textContent = this.currentUser.email || '';
    if (dropRole) dropRole.textContent = this.currentUser.role;
    if (avatarEl && this.currentUser.name) {
      avatarEl.textContent = this.currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
  },

  async submitLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
      if (errorEl) errorEl.textContent = 'Please enter both email and password.';
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.currentUser = data.user;
          this.updateUserUI();
          this.closeModal('loginModal');
          this.showToast(`Welcome back, ${data.user.name}!`);
        }
      } else {
        const err = await res.json();
        if (errorEl) errorEl.textContent = err.error || 'Authentication failed.';
      }
    } catch (e) {
      if (errorEl) errorEl.textContent = 'Server connection error or PostgreSQL not configured.';
    }
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.showToast('You have been signed out.');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 400);
  },

  handleGlobalSearch(event) {
    if (event.key === 'Enter') {
      const q = event.target.value.trim();
      if (q) {
        window.location.href = `/leads.html?search=${encodeURIComponent(q)}`;
      }
    }
  },

  formatCurrency(num, curr = 'NPR') {
    if (num === null || num === undefined) return '—';
    return `${curr} ${Number(num).toLocaleString()}`;
  },

  formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  toast: {
    container: null,
    init() {
      if (typeof document === 'undefined') return;
      if (!this.container || !document.body.contains(this.container)) {
        let el = document.getElementById('salesos-toast-container');
        if (!el) {
          el = document.createElement('div');
          el.id = 'salesos-toast-container';
          el.className = 'toast-container';
          el.setAttribute('aria-live', 'polite');
          document.body.appendChild(el);
        }
        this.container = el;
      }
    },
    show(message, type = 'info', duration = 3500) {
      this.init();
      if (!this.container) return;
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠️',
        info: 'ℹ'
      };
      const icon = icons[type] || '✦';

      toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${SalesOS.escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Dismiss">&times;</button>
      `;

      this.container.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => {
          toast.classList.add('toast-fade-out');
          setTimeout(() => toast.remove(), 250);
        }, duration);
      }
      return toast;
    },
    success(msg, d) { return this.show(msg, 'success', d); },
    error(msg, d) { return this.show(msg, 'error', d); },
    warning(msg, d) { return this.show(msg, 'warning', d); },
    info(msg, d) { return this.show(msg, 'info', d); }
  },

  showToast(message, type = 'info', duration = 3500) {
    return this.toast.show(message, type, duration);
  },

  // In-App WebRTC Softphone Controller
  softphoneState: {
    isOpen: false,
    callId: null,
    status: 'idle', // idle, connecting, in_progress, ended
    startTime: null,
    timerInterval: null
  },

  toggleSoftphone() {
    const el = document.getElementById('softphoneWidget');
    if (!el) return;
    this.softphoneState.isOpen = !this.softphoneState.isOpen;
    if (this.softphoneState.isOpen) {
      el.classList.add('active');
      const inp = document.getElementById('softphoneInput');
      if (inp) inp.focus();
    } else {
      el.classList.remove('active');
    }
  },

  appendDialDigit(digit) {
    const inp = document.getElementById('softphoneInput');
    if (inp) {
      inp.value += digit;
    }
  },

  clearDialDigit() {
    const inp = document.getElementById('softphoneInput');
    if (inp && inp.value.length > 0) {
      inp.value = inp.value.slice(0, -1);
    }
  },

  async handleSoftphoneAction() {
    if (this.softphoneState.status === 'in_progress' || this.softphoneState.status === 'connecting') {
      await this.endSoftphoneCall();
    } else {
      const inp = document.getElementById('softphoneInput');
      const number = inp ? inp.value.trim() : '';
      if (!number) {
        this.showToast('Please enter a phone number to dial', 'warning');
        return;
      }
      await this.startSoftphoneCall(number);
    }
  },

  async startSoftphoneCall(phoneNumber) {
    const statusBadge = document.getElementById('softphoneStatusBadge');
    const actionBtn = document.getElementById('softphoneActionBtn');
    const timerEl = document.getElementById('softphoneTimer');

    if (statusBadge) {
      statusBadge.textContent = 'CONNECTING...';
      statusBadge.className = 'badge badge-orange';
    }
    if (actionBtn) {
      actionBtn.textContent = 'Connecting...';
      actionBtn.style.background = '#f59e0b';
      actionBtn.style.borderColor = '#f59e0b';
    }

    try {
      const res = await fetch('/api/telephony/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_number: phoneNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dial');

      this.softphoneState.callId = data.session_id;
      this.softphoneState.status = 'in_progress';
      this.softphoneState.startTime = Date.now();

      if (statusBadge) {
        statusBadge.textContent = 'CONNECTED';
        statusBadge.className = 'badge badge-green';
      }
      if (actionBtn) {
        actionBtn.textContent = '🛑 End Call';
        actionBtn.style.background = '#ef4444';
        actionBtn.style.borderColor = '#ef4444';
      }
      if (timerEl) {
        timerEl.style.display = 'inline-block';
        timerEl.textContent = '00:00';
      }

      this.softphoneState.timerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - this.softphoneState.startTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const secs = String(elapsedSec % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
      }, 1000);

      this.showToast(`Call connected to ${phoneNumber}`, 'success');
    } catch (e) {
      this.showToast(e.message || 'Call failed', 'error');
      this.resetSoftphoneUI();
    }
  },

  async endSoftphoneCall() {
    if (this.softphoneState.timerInterval) {
      clearInterval(this.softphoneState.timerInterval);
    }
    const elapsedSec = this.softphoneState.startTime ? Math.max(1, Math.floor((Date.now() - this.softphoneState.startTime) / 1000)) : 1;

    try {
      if (this.softphoneState.callId) {
        await fetch('/api/telephony/call-end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: this.softphoneState.callId,
            duration_seconds: elapsedSec,
            notes: 'Completed in-app WebRTC softphone call.'
          })
        });
      }
      this.showToast(`Call ended. Logged ${elapsedSec}s to activity timeline.`, 'info');
    } catch (e) {}

    this.resetSoftphoneUI();
  },

  resetSoftphoneUI() {
    if (this.softphoneState.timerInterval) clearInterval(this.softphoneState.timerInterval);
    this.softphoneState.callId = null;
    this.softphoneState.status = 'idle';
    this.softphoneState.startTime = null;

    const statusBadge = document.getElementById('softphoneStatusBadge');
    const actionBtn = document.getElementById('softphoneActionBtn');
    const timerEl = document.getElementById('softphoneTimer');

    if (statusBadge) {
      statusBadge.textContent = 'READY';
      statusBadge.className = 'badge badge-green';
    }
    if (actionBtn) {
      actionBtn.textContent = '📞 Call Now';
      actionBtn.style.background = '#10b981';
      actionBtn.style.borderColor = '#10b981';
    }
    if (timerEl) {
      timerEl.style.display = 'none';
      timerEl.textContent = '00:00';
    }
  },

  initTheme() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('salesos_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  toggleTheme() {
    if (typeof window === 'undefined') return;
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('salesos_theme', next);
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
    this.showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} mode`, 'info', 1500);
  },

  formatDualDate(date, options = {}) {
    if (typeof window !== 'undefined' && window.BSCalendar) {
      return window.BSCalendar.formatDualDate(date, options);
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid Date' : d.toISOString().split('T')[0];
  },

  currentNepaliFiscalYear(date) {
    if (typeof window !== 'undefined' && window.BSCalendar) {
      return window.BSCalendar.getNepaliFiscalYear(date);
    }
    return 'FY 2083/84';
  },

  formatCurrency(amount, currency = 'NPR') {
    const num = Number(amount) || 0;
    return `${currency} ${num.toLocaleString()}`;
  }
};

if (typeof window !== 'undefined') {
  window.escapeHtml = (s) => SalesOS.escapeHtml(s);
  window.SalesOS = SalesOS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SalesOS;
}
