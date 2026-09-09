// SalesOS Shared App Shell & Client Library
const SalesOS = {
  currentUser: { id: null, name: 'User', role: 'member', email: '', tenant_id: null },
  tenant: { id: null, name: 'SalesOS Workspace', plan: 'Enterprise SaaS', currency: 'USD' },

  routes: [
    { label: 'Dashboard', path: '/', icon: '▦', section: 'Workspace' },
    { label: 'Inbox', path: '/inbox', icon: '☵', section: 'Workspace', badge: '12', badgeClass: 'badge-blue' },
    { label: 'Leads', path: '/leads', icon: '♙', section: 'Workspace' },
    { label: 'Contacts', path: '/contacts', icon: '◉', section: 'Workspace' },
    { label: 'Companies', path: '/companies', icon: '▱', section: 'Workspace' },
    { label: 'Deals', path: '/deals', icon: '◇', section: 'Revenue Pipeline' },
    { label: 'Quotes', path: '/quotes', icon: '📄', section: 'Revenue Pipeline' },
    { label: 'Products', path: '/products', icon: '▤', section: 'Revenue Pipeline' },
    { label: 'Tasks', path: '/tasks', icon: '✓', section: 'Revenue Pipeline' },
    { label: 'Campaigns', path: '/campaigns', icon: '◌', section: 'Autonomous AI' },
    { label: 'AI Agents & Approvals', path: '/approvals', icon: '✦', section: 'Autonomous AI', badge: '3', badgeClass: 'badge-orange' },
    { label: 'Automations', path: '/automations', icon: '⚙', section: 'Autonomous AI' },
    { label: 'Channels & Ingestion', path: '/settings?tab=channels', icon: '🌐', section: 'Autonomous AI', badge: 'New', badgeClass: 'badge-green' },
    { label: 'Knowledge Base', path: '/settings?tab=knowledge', icon: '📚', section: 'Autonomous AI' },
    { label: 'Reports', path: '/reports', icon: '▥', section: 'Analytics & Manage' },
    { label: 'Settings', path: '/settings', icon: '⚙', section: 'Analytics & Manage' },
  ],

  init(activeRouteName, breadcrumbs = []) {
    // Clean URL normalization: strip .html extension in browser address bar without reload
    if (typeof window !== 'undefined' && window.location && window.location.pathname.endsWith('.html')) {
      const clean = (window.location.pathname === '/index.html') ? '/' : window.location.pathname.replace(/\.html$/, '');
      window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
    }

    this.initTheme();
    this.checkSession();
    this.renderSidebar(activeRouteName);
    this.initSidebarCollapse();
    this.refreshSidebarBadges();
    this.renderTopbar(breadcrumbs);
    this.initTheme();
    this.renderModals();
    this.setupGlobalEvents();
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.update().catch(() => {});
      }).catch(() => {});
    }
  },

  renderSidebar(activeRouteName) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const currentPath = window.location.pathname;

    let html = `
      <a href="/" class="brand">
        <div class="brand-mark">✦</div>
        <div class="brand-text">
          <span>SalesOS</span>
          <span class="brand-badge">AI-FIRST OS</span>
        </div>
      </a>

      <div class="tenant-badge" role="button" tabindex="0" onclick="location.href='/settings'" onkeydown="if(event.key==='Enter'||event.key===' ')location.href='/settings'" title="Switch or edit workspace" aria-label="Switch or edit workspace">
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
      // Print section divider if changed
      if (route.section && route.section !== currentSection) {
        currentSection = route.section;
        html += `<div class="nav-section-title">${this.escapeHtml(currentSection)}</div>`;
      }

      // Check if this route is currently active
      const cleanCurrent = currentPath.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      const cleanRoutePath = route.path.split('?')[0].replace(/\.html$/, '').replace(/\/$/, '') || '/';
      const isActive = activeRouteName === route.label || 
        cleanCurrent === cleanRoutePath || 
        (cleanRoutePath === '/' && (cleanCurrent === '/' || cleanCurrent === '/index' || cleanCurrent === '/dashboard'));

      html += `
        <a href="${route.path}" class="nav-item ${isActive ? 'active' : ''}" id="nav-${route.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" title="${this.escapeHtml(route.label)}">
          <span class="nav-icon">${route.icon}</span>
          <span>${this.escapeHtml(route.label)}</span>
          ${route.badge ? `<span class="nav-badge ${this.escapeHtml(route.badgeClass || '')}">${this.escapeHtml(route.badge)}</span>` : ''}
        </a>
      `;
    });

    html += `
      </nav>
      <div class="sidebar-footer">
        <div class="agent-mini-card">
          <b>✦ Autonomous Sales Engine</b>
          <p>Handled 68% of inbound conversations autonomously this week.</p>
          <a href="/approvals">Review AI actions →</a>
        </div>
        <a href="/onboarding" class="nav-item" style="color:var(--blue);font-weight:600" title="12-Step Setup Wizard">
          <span class="nav-icon">✨</span>
          <span>12-Step Setup Wizard</span>
        </a>
        <a href="/superadmin" class="nav-item" id="sidebarSuperadminLink" style="color:#a855f7;font-weight:600;display:${(this.currentUser?.role === 'superadmin' || this.currentUser?.is_impersonating) ? 'flex' : 'none'}" title="Platform Superadmin">
          <span class="nav-icon">⚡</span>
          <span>Platform Superadmin</span>
        </a>
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" onclick="SalesOS.toggleSidebarCollapse()" title="Toggle Sidebar (Ctrl+\\)">
          <span class="collapse-icon">«</span>
          <span class="collapse-text">Collapse Rail</span>
        </button>
      </div>
    `;

    sidebar.innerHTML = html;
  },

  initSidebarCollapse() {
    if (typeof window === 'undefined') return;
    const isCollapsed = localStorage.getItem('salesos_sidebar_collapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    const btnIcon = document.querySelector('.collapse-icon');
    if (sidebar && isCollapsed) {
      sidebar.classList.add('collapsed');
      if (btnIcon) btnIcon.textContent = '»';
    }
  },

  toggleSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('salesos_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    const btnIcon = document.querySelector('.collapse-icon');
    if (btnIcon) btnIcon.textContent = isCollapsed ? '»' : '«';
  },

  async refreshSidebarBadges() {
    try {
      // 1. Fetch AI pending approvals count
      const rApp = await fetch('/api/ai-approvals');
      if (rApp.ok) {
        const apps = await rApp.json();
        const pendingCount = Array.isArray(apps) ? apps.filter(a => a.status === 'pending').length : 0;
        const appBadge = document.querySelector('#nav-ai-agents---approvals .nav-badge');
        if (appBadge) {
          appBadge.textContent = pendingCount;
          appBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
      }

      // 2. Fetch unread conversations count
      const rConv = await fetch('/api/conversations');
      if (rConv.ok) {
        const convs = await rConv.json();
        const unreadCount = Array.isArray(convs) ? convs.filter(c => c.unread).length : 0;
        const inboxBadge = document.querySelector('#nav-inbox .nav-badge');
        if (inboxBadge) {
          inboxBadge.textContent = unreadCount;
          inboxBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
      }
    } catch (_) {}
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    let backdrop = document.getElementById('sidebarBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'sidebarBackdrop';
      backdrop.className = 'sidebar-backdrop';
      backdrop.onclick = () => SalesOS.closeSidebar();
      document.body.appendChild(backdrop);
    }
    if (sidebar.classList.contains('open')) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.classList.remove('active');
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
            <a href="/leads?action=new">♙ New Lead</a>
            <a href="/deals?action=new">◇ New Deal</a>
            <a href="/quotes?action=new">📄 New Quote</a>
            <a href="/tasks?action=new">✓ New Task</a>
          </div>
        </div>

        <button class="btn-icon" title="WebRTC Softphone Dialer" aria-label="WebRTC Softphone Dialer" id="btnToggleSoftphone" onclick="SalesOS.toggleSoftphone()" style="position:relative">
          <span>📞</span>
        </button>

        <button class="btn-icon" title="Toggle Light / Dark Theme" aria-label="Toggle Light or Dark Theme" id="btnThemeToggle" onclick="SalesOS.toggleTheme()" style="position:relative;font-size:14px">
          <span id="themeToggleIcon">${(document.documentElement.getAttribute('data-theme') || localStorage.getItem('salesos_theme')) === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <button class="btn-icon" title="Notifications" aria-label="Notifications" onclick="SalesOS.showToast('All systems operational. 3 AI actions pending review.', 'info')">
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
            <a href="/settings">👤 Workspace Settings</a>
            <a href="/approvals">✦ AI Guardrails</a>
            <a href="/superadmin" style="color:#a855f7;font-weight:600">⚡ Superadmin Control Plane</a>
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
              <input type="email" id="loginEmail" class="form-control" placeholder="name@company.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="loginPassword" class="form-control" placeholder="••••••••">
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
    if (this._globalEventsBound) return;
    this._globalEventsBound = true;

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

      // Global keyboard shortcut: Ctrl+\ or Cmd+\ toggles sidebar rail collapse
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        SalesOS.toggleSidebarCollapse();
      }
    });
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

  confirm(options) {
    const title = options.title || 'Confirm Action';
    const message = options.message || 'Are you sure you want to proceed?';
    const confirmText = options.confirmText || 'Confirm';
    const cancelText = options.cancelText || 'Cancel';
    const isDanger = options.danger !== false;

    let modal = document.getElementById('salesosConfirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'salesosConfirmModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width:420px">
        <div class="modal-header">
          <h3 style="margin:0;font-size:16px">${this.escapeHtml(title)}</h3>
          <button class="modal-close" aria-label="Close dialog" onclick="SalesOS.closeModal('salesosConfirmModal')">×</button>
        </div>
        <div class="modal-body" style="padding:18px 24px;font-size:14px;color:var(--ink)">
          ${this.escapeHtml(message)}
        </div>
        <div class="modal-footer" style="padding:14px 24px;display:flex;justify-content:flex-end;gap:10px">
          <button type="button" class="btn btn-secondary" onclick="SalesOS.closeModal('salesosConfirmModal')">${this.escapeHtml(cancelText)}</button>
          <button type="button" class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="salesosConfirmBtn">${this.escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.getElementById('salesosConfirmBtn').onclick = () => {
      SalesOS.closeModal('salesosConfirmModal');
      if (typeof options.onConfirm === 'function') options.onConfirm();
    };

    this.showModal('salesosConfirmModal');
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
    const cleanPath = path.replace(/\.html$/, '') || '/';
    const isPublicPage = cleanPath === '/login' ||
                         cleanPath === '/quote-view' ||
                         cleanPath === '/reset-password' ||
                         cleanPath === '/404';
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          this.currentUser = data.user;
          if (data.tenant) this.tenant = data.tenant;
          this.updateUserUI();
          this.updateTenantUI();
          this.initEventStream();
          this.ensureBSCalendar();
          this.renderImpersonationBanner();
        }
      } else if (res.status === 401 && !isPublicPage) {
        window.location.href = `/login?redirect=${encodeURIComponent(path + window.location.search)}`;
      }
    } catch (e) {
      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }
  },

  renderImpersonationBanner() {
    if (!this.currentUser?.is_impersonating) return;
    let banner = document.getElementById('impersonationBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'impersonationBanner';
      banner.style.cssText = 'background:linear-gradient(90deg, #6366f1, #a855f7);color:white;padding:8px 18px;font-size:12px;font-weight:600;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,0.3)';
      banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:14px">⚡</span>
          <span><strong>Superadmin Impersonation Mode:</strong> Viewing tenant <u>${this.escapeHtml(this.tenant?.name || 'Workspace')}</u> as <u>${this.escapeHtml(this.currentUser.name)}</u> (${this.escapeHtml(this.currentUser.role)})</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <a href="/superadmin" style="background:rgba(255,255,255,0.2);color:white;text-decoration:none;padding:3px 10px;border-radius:4px;font-size:11px">Superadmin Console</a>
          <button id="btnExitImpersonation" style="background:white;color:#6b21a8;border:none;border-radius:4px;padding:4px 12px;font-weight:700;font-size:11px;cursor:pointer" onclick="SalesOS.exitImpersonation()">
            Exit Impersonation ✕
          </button>
        </div>
      `;
      document.body.prepend(banner);
    }
  },

  async exitImpersonation() {
    try {
      const res = await fetch('/api/superadmin/switch-back', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/superadmin';
      } else {
        SalesOS.showToast('Failed to exit impersonation session.', 'error');
      }
    } catch (e) {
      SalesOS.showToast('Network error while exiting impersonation.', 'error');
    }
  },

  initEventStream() {
    if (typeof window === 'undefined' || !window.EventSource) return;
    if (this._sseConnected) return;
    const path = window.location.pathname;
    const cleanPath = path.replace(/\.html$/, '') || '/';
    const isPublicPage = cleanPath === '/login' ||
                         cleanPath === '/quote-view' ||
                         cleanPath === '/reset-password' ||
                         cleanPath === '/404';
    if (isPublicPage) return;

    try {
      const evtSource = new EventSource('/api/events/stream');
      this._sseConnected = true;

      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          window.dispatchEvent(new CustomEvent('salesos:event', { detail: data }));

          if (data.type === 'lead.sla_breached') {
            SalesOS.showToast(`⚠️ Lead SLA Breach Alert! ${data.payload?.breached_count || 1} lead(s) overdue. Escalated to tasks.`, 'error');
          } else if (data.type === 'quote.signed') {
            SalesOS.showToast(`📄 Quote accepted & digitally signed by customer!`, 'success');
          } else if (data.type === 'quote.paid') {
            SalesOS.showToast(`💰 Quote payment verified & deal marked Closed Won!`, 'success');
          } else if (data.type === 'message.received') {
            SalesOS.showToast(`💬 Inbound message from ${data.payload?.sender_name || 'customer'}`, 'info');
          } else if (data.type === 'ai_approval.created') {
            SalesOS.showToast(`✦ New AI action approval requested: ${data.payload?.action || 'tool'}`, 'info');
            SalesOS.refreshSidebarBadges();
          } else if (data.type === 'handoff.created') {
            SalesOS.showToast(`👤 Lead escalated to human sales operator queue`, 'info');
          }
        } catch (_) {}
      };

      evtSource.onerror = () => {
        this._sseConnected = false;
        evtSource.close();
        setTimeout(() => this.initEventStream(), 10000);
      };
    } catch (_) {}
  },

  async ensureBSCalendar() {
    if (typeof window === 'undefined') return;
    if (window.BSCalendar) return;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '/bs-calendar.js';
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
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
    const superLink = document.getElementById('sidebarSuperadminLink');
    if (superLink) {
      superLink.style.display = (this.currentUser?.role === 'superadmin' || this.currentUser?.is_impersonating) ? 'flex' : 'none';
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
      window.location.href = '/login';
    }, 400);
  },

  handleGlobalSearch(event) {
    if (event.key === 'Enter') {
      const q = event.target.value.trim();
      if (q) {
        window.location.href = `/leads?search=${encodeURIComponent(q)}`;
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
    let theme = localStorage.getItem('salesos_theme');
    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      localStorage.setItem('salesos_theme', theme);
    }
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeToggleIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  toggleTheme() {
    if (typeof window === 'undefined') return;
    const current = document.documentElement.getAttribute('data-theme') || localStorage.getItem('salesos_theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('salesos_theme', next);
    localStorage.setItem('salesos_theme_explicit', 'true');
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

  formatCurrency(amount, currency = null) {
    const curr = currency || this.tenant?.currency || 'USD';
    const num = Number(amount) || 0;
    return `${curr} ${num.toLocaleString()}`;
  },

  // FE-9: Skeleton loading state system — shimmer placeholders while data loads
  // Usage: SalesOS.showSkeleton('#leads-table', { rows: 6, cols: 5 });
  //        await fetchData();
  //        SalesOS.hideSkeleton('#leads-table');
  showSkeleton(selector, { rows = 5, cols = 4, type = 'table' } = {}) {
    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container) return;

    // Inject skeleton CSS once
    if (!document.getElementById('sos-skeleton-styles')) {
      const style = document.createElement('style');
      style.id = 'sos-skeleton-styles';
      style.textContent = `
        @keyframes sos-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sos-skeleton-row { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border, #e5e7eb); }
        .sos-skeleton-cell {
          height: 14px; border-radius: 6px; flex: 1;
          background: linear-gradient(90deg, var(--skeleton-base, #e5e7eb) 25%, var(--skeleton-shine, #f3f4f6) 50%, var(--skeleton-base, #e5e7eb) 75%);
          background-size: 600px 100%;
          animation: sos-shimmer 1.4s infinite linear;
        }
        .sos-skeleton-cell.wide { flex: 2; }
        .sos-skeleton-cell.narrow { flex: 0.5; }
        .dark .sos-skeleton-cell { --skeleton-base: #374151; --skeleton-shine: #4b5563; }
        .sos-skeleton-header { height: 10px; border-radius: 4px; background: var(--skeleton-base, #e5e7eb); margin-bottom: 4px; }
        .sos-skeleton-wrap { padding: 4px 0; }
        .sos-skeleton-card {
          border-radius: 10px; padding: 16px; margin-bottom: 12px;
          background: linear-gradient(90deg, var(--skeleton-base, #e5e7eb) 25%, var(--skeleton-shine, #f3f4f6) 50%, var(--skeleton-base, #e5e7eb) 75%);
          background-size: 600px 100%;
          animation: sos-shimmer 1.4s infinite linear;
          min-height: 80px;
        }
      `;
      document.head.appendChild(style);
    }

    container.dataset.skeletonOriginal = container.innerHTML;
    container.dataset.skeletonActive = '1';

    if (type === 'cards') {
      container.innerHTML = Array.from({ length: rows }, () => `<div class="sos-skeleton-card"></div>`).join('');
    } else {
      // Default: table rows with variable-width cells
      const widths = ['wide', '', '', 'narrow'];
      container.innerHTML = `
        <div class="sos-skeleton-wrap">
          ${Array.from({ length: rows }, () => `
            <div class="sos-skeleton-row">
              ${Array.from({ length: cols }, (_, i) => `<div class="sos-skeleton-cell ${widths[i % widths.length] || ''}"></div>`).join('')}
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  hideSkeleton(selector) {
    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!container || !container.dataset.skeletonActive) return;
    delete container.dataset.skeletonActive;
    // Caller is responsible for populating real content after hideSkeleton
  },

  // Helper: wraps an async fetch with skeleton on a container, then auto-hides
  async withSkeleton(selector, fetchFn, skeletonOpts = {}) {
    this.showSkeleton(selector, skeletonOpts);
    try {
      return await fetchFn();
    } finally {
      this.hideSkeleton(selector);
    }
  }
};

if (typeof window !== 'undefined') {
  window.escapeHtml = (s) => SalesOS.escapeHtml(s);
  window.SalesOS = SalesOS;
  SalesOS.initTheme();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SalesOS;
}
