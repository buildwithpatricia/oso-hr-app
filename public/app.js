// Global state
let currentUser = null;
let authToken = null;
let companies = [];
let users = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadCompanies();
    checkAuth();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('showRegisterBtn').addEventListener('click', showRegister);
    
    // Register form
    document.getElementById('registerBtn').addEventListener('click', register);
    document.getElementById('showLoginBtn').addEventListener('click', showLogin);
    
    // Dashboard
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('requestTimeOffBtn').addEventListener('click', showTimeOffForm);
    
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('approve-btn') || e.target.closest('.approve-btn')) {
            const btn = e.target.classList.contains('approve-btn') ? e.target : e.target.closest('.approve-btn');
            const requestId = btn.getAttribute('data-request-id');
            approveRequest(requestId);
        }
        
        if (e.target.classList.contains('reject-btn') || e.target.closest('.reject-btn')) {
            const btn = e.target.classList.contains('reject-btn') ? e.target : e.target.closest('.reject-btn');
            const requestId = btn.getAttribute('data-request-id');
            rejectRequest(requestId);
        }
        
        
        if (e.target.classList.contains('back-to-profiles-btn') || e.target.closest('.back-to-profiles-btn')) {
            loadProfiles();
        }
        
        if (e.target.classList.contains('submit-request-btn') || e.target.closest('.submit-request-btn')) {
            submitTimeOffRequest();
        }
        
        if (e.target.classList.contains('cancel-request-btn') || e.target.closest('.cancel-request-btn')) {
            const form = e.target.closest('.timeoff-form');
            if (form) form.remove();
        }
    });
}

// Authentication functions
async function loadCompanies() {
    try {
        const response = await fetch('/api/companies');
        const data = await response.json();
        companies = data.companies;
        
        const companySelect = document.getElementById('regCompany');
        companySelect.innerHTML = '<option value="">Select a company</option>';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            companySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        users = data.users;
        
        const managerSelect = document.getElementById('regManager');
        managerSelect.innerHTML = '<option value="">No manager</option>';
        users.forEach(user => {
            if (user.role === 'manager' || user.role === 'ceo') {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.firstName} ${user.lastName}`;
                managerSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        loadUserProfile();
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        currentUser = data.user;
        
        document.getElementById('userName').textContent = `Welcome, ${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('dashboard').classList.add('active');
        
        // Show/hide approvals tab based on user role
        const approvalsTab = document.getElementById('approvalsTab');
        if (currentUser.role === 'manager' || currentUser.role === 'ceo') {
            approvalsTab.style.display = 'block';
        } else {
            approvalsTab.style.display = 'none';
        }
        
        loadTimeOffRequests();
    } catch (error) {
        console.error('Error loading user profile:', error);
        logout();
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;
            
            document.getElementById('userName').textContent = `Welcome, ${currentUser.firstName} ${currentUser.lastName}`;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            
            loadTimeOffRequests();
            loadProfiles();
            updateTabVisibility();
            showMessage('Login successful!', 'success');
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed. Please try again.', 'error');
    }
}

async function register() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const location = document.getElementById('regLocation').value;
    const companyId = document.getElementById('regCompany').value;
    const managerId = document.getElementById('regManager').value;
    const role = document.getElementById('regRole').value;
    
    if (!email || !password || !firstName || !lastName || !companyId) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                firstName,
                lastName,
                location,
                companyId: parseInt(companyId),
                managerId: managerId ? parseInt(managerId) : null,
                role
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.user;
            
            document.getElementById('userName').textContent = `Welcome, ${currentUser.firstName} ${currentUser.lastName}`;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            
            loadTimeOffRequests();
            loadProfiles();
            updateTabVisibility();
            showMessage('Registration successful!', 'success');
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Registration failed. Please try again.', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').classList.add('hidden');
    
    // Clear profile data
    document.getElementById('myProfileContent').innerHTML = '<div class="loading">Loading your profile...</div>';
    document.getElementById('directReportsContent').innerHTML = '<div class="loading">Loading direct reports...</div>';
    document.getElementById('profilesContent').innerHTML = '<div class="loading">Loading profiles...</div>';
    document.getElementById('directReportsSection').classList.add('hidden');
    
    // Reset tab visibility
    const timeOffTab = document.querySelector('[data-section="timeoff"]');
    if (timeOffTab) {
        timeOffTab.style.display = 'block'; // Reset to default
    }
    
    clearForm();
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').classList.add('hidden');
    clearForm();
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').classList.remove('hidden');
    loadUsers();
    clearForm();
}

function clearForm() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regFirstName').value = '';
    document.getElementById('regLastName').value = '';
    document.getElementById('regLocation').value = '';
    document.getElementById('regCompany').value = '';
    document.getElementById('regManager').value = '';
    document.getElementById('regRole').value = 'employee';
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Update tab visibility based on user role and permissions
async function updateTabVisibility() {
    if (!currentUser) return;
    
    try {
        // Check if user has direct reports (is a manager)
        const response = await fetch(`/api/users/${currentUser.id}/reports`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const timeOffTab = document.querySelector('[data-section="timeoff"]');
        
        if (response.ok) {
            const data = await response.json();
            const hasDirectReports = data.reports && data.reports.length > 0;
            
            // Show Time Off tab only if user has direct reports
            if (timeOffTab) {
                timeOffTab.style.display = hasDirectReports ? 'block' : 'none';
            }
        } else {
            // If user can't access reports endpoint, they're not a manager
            if (timeOffTab) {
                timeOffTab.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking direct reports:', error);
        // Hide Time Off tab on error
        const timeOffTab = document.querySelector('[data-section="timeoff"]');
        if (timeOffTab) {
            timeOffTab.style.display = 'none';
        }
    }
}

// Navigation functions
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(section + 'Section').classList.remove('hidden');
    
    // Add active class to clicked button
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Load section data
    switch(section) {
        case 'timeoff':
            loadTimeOffRequests();
            break;
        case 'profiles':
            loadProfiles();
            break;
        case 'requests':
            loadMyRequests();
            break;
        case 'approvals':
            loadPendingApprovals();
            break;
    }
}

// Data loading functions
async function loadMyProfile() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        // Find current user's profile
        const myProfile = data.users.find(user => user.id === currentUser.id);
        if (!myProfile) {
            console.error('Current user profile not found');
            return;
        }
        
        // Get manager name if exists
        let managerName = 'None';
        if (myProfile.managerId) {
            const manager = data.users.find(user => user.id === myProfile.managerId);
            if (manager) {
                managerName = `${manager.firstName} ${manager.lastName}`;
            }
        }
        
        return {
            ...myProfile,
            managerName
        };
    } catch (error) {
        console.error('Error loading my profile:', error);
        return null;
    }
}

async function loadTimeOffRequests() {
    try {
        const response = await fetch('/api/timeoff', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        const content = document.getElementById('timeoffContent');
        if (data.requests.length === 0) {
            content.innerHTML = '<p>No time-off requests found.</p>';
            return;
        }
        
        content.innerHTML = data.requests.map(request => `
            <div class="request-item ${request.status}">
                <div class="request-header">
                    <div class="request-user">${request.userName || 'Unknown User'}</div>
                    <div class="request-status status-${request.status}">${request.status}</div>
                </div>
                <div class="request-dates">
                    ${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}
                </div>
                <div class="request-reason">${request.reason || 'No reason provided'}</div>
                ${request.status === 'pending' ? `
                    <div class="request-actions">
                        <button class="btn btn-sm btn-success approve-btn" data-request-id="${request.id}">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger reject-btn" data-request-id="${request.id}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading time-off requests:', error);
        document.getElementById('timeoffContent').innerHTML = '<p>Error loading time-off requests.</p>';
    }
}

async function loadProfiles() {
    try {
        console.log('Loading profiles for current user:', currentUser);
        
        // Load my profile
        await loadMyProfileSection();
        
        // Load direct reports if user is a manager
        await loadDirectReportsSection();
        
        // Load other employees
        await loadOtherProfilesSection();
        
    } catch (error) {
        console.error('Error loading profiles:', error);
        document.getElementById('profilesContent').innerHTML = '<p>Error loading profiles.</p>';
    }
}

async function loadMyProfileSection() {
    try {
        // Get the current user's profile with sensitive data
        const response = await fetch(`/api/users/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        const profile = data.user;
        
        console.log('Loading My Profile for user:', currentUser.id, 'Profile data:', profile);
        console.log('Current user object:', currentUser);
        console.log('Profile name from API:', profile.firstName, profile.lastName);
        console.log('Profile ID from API:', profile.id);
        
        // Get manager name
        let managerName = 'None';
        if (profile.managerId) {
            const managerResponse = await fetch(`/api/users/${profile.managerId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const managerData = await managerResponse.json();
            if (managerData.user) {
                managerName = `${managerData.user.firstName} ${managerData.user.lastName}`;
            }
        }
        
            const hasSensitiveData = profile.salary !== undefined || profile.ssn !== undefined;
            
            document.getElementById('myProfileContent').innerHTML = `
                <div class="profile-card">
                    <h5>${profile.firstName} ${profile.lastName}</h5>
                    <div class="profile-info">
                        <div>
                            <label>Location:</label>
                            <span>${profile.location || 'Not specified'}</span>
                        </div>
                        <div>
                            <label>Role:</label>
                            <span>${profile.role}</span>
                        </div>
                        <div>
                            <label>Manager:</label>
                            <span>${managerName}</span>
                        </div>
                        ${hasSensitiveData ? `
                            <div>
                                <label>Salary:</label>
                                <span class="sensitive-field" data-field="salary">
                                    <span class="hidden-value">*****</span>
                                    <span class="actual-value" style="display: none;">${profile.salary ? '$' + profile.salary.toLocaleString() : 'Not disclosed'}</span>
                                </span>
                            </div>
                            <div>
                                <label>SSN:</label>
                                <span class="sensitive-field" data-field="ssn">
                                    <span class="hidden-value">*****</span>
                                    <span class="actual-value" style="display: none;">${profile.ssn || 'Not disclosed'}</span>
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    ${hasSensitiveData ? `
                        <button class="toggle-sensitive-small" id="toggleMySensitiveBtn">
                            <i class="fas fa-eye"></i> <span class="btn-text">Reveal sensitive information</span>
                        </button>
                    ` : ''}
                </div>
            `;
        
        // Add event listener for sensitive info toggle
        const toggleBtn = document.getElementById('toggleMySensitiveBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                const isRevealed = this.querySelector('.btn-text').textContent === 'Hide Sensitive Info';
                const hiddenValues = document.querySelectorAll('#myProfileContent .sensitive-field .hidden-value');
                const actualValues = document.querySelectorAll('#myProfileContent .sensitive-field .actual-value');
                const btnText = this.querySelector('.btn-text');
                const icon = this.querySelector('i');
                
                if (isRevealed) {
                    hiddenValues.forEach(el => el.style.display = 'inline');
                    actualValues.forEach(el => el.style.display = 'none');
                    btnText.textContent = 'Reveal Sensitive Info';
                    icon.className = 'fas fa-eye';
                } else {
                    hiddenValues.forEach(el => el.style.display = 'none');
                    actualValues.forEach(el => el.style.display = 'inline');
                    btnText.textContent = 'Hide Sensitive Info';
                    icon.className = 'fas fa-eye-slash';
                }
            });
        }
    } catch (error) {
        console.error('Error loading my profile:', error);
        document.getElementById('myProfileContent').innerHTML = '<p>Error loading your profile.</p>';
    }
}

async function loadDirectReportsSection() {
    try {
        console.log('Loading direct reports for user:', currentUser.id);
        
        // Check if user is a manager by trying to load their direct reports
        const response = await fetch(`/api/users/${currentUser.id}/reports`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 403) {
            // User is not a manager, hide the section
            console.log('User is not a manager, hiding direct reports section');
            document.getElementById('directReportsSection').classList.add('hidden');
            return;
        }
        
        const data = await response.json();
        const reports = data.reports || [];
        
        console.log('Direct reports found:', reports.length, reports);
        
        if (reports.length === 0) {
            document.getElementById('directReportsContent').innerHTML = '<p>No direct reports found.</p>';
        } else {
            document.getElementById('directReportsContent').innerHTML = `
                <div class="profile-grid">
                    ${reports.map(report => `
                        <div class="profile-card">
                            <h5>${report.firstName} ${report.lastName}</h5>
                            <div class="profile-info">
                                <div>
                                    <label>Location:</label>
                                    <span>${report.location || 'Not specified'}</span>
                                </div>
                                <div>
                                    <label>Role:</label>
                                    <span>${report.role}</span>
                                </div>
                                <div>
                                    <label>Salary:</label>
                                    <span class="sensitive-field" data-field="salary">
                                        <span class="hidden-value">*****</span>
                                        <span class="actual-value" style="display: none;">${report.salary ? '$' + report.salary.toLocaleString() : 'Not disclosed'}</span>
                                    </span>
                                </div>
                                <div>
                                    <label>SSN:</label>
                                    <span class="sensitive-field" data-field="ssn">
                                        <span class="hidden-value">*****</span>
                                        <span class="actual-value" style="display: none;">${report.ssn || 'Not disclosed'}</span>
                                    </span>
                                </div>
                            </div>
                            <button class="toggle-sensitive-small" data-user-id="${report.id}">
                                <i class="fas fa-eye"></i> <span class="btn-text">Reveal sensitive information</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Show the direct reports section
        document.getElementById('directReportsSection').classList.remove('hidden');
        
        // Add event listeners for sensitive info toggles
        document.querySelectorAll('#directReportsContent .toggle-sensitive-small').forEach(btn => {
            btn.addEventListener('click', function() {
                const isRevealed = this.querySelector('.btn-text').textContent === 'Hide Sensitive Info';
                const card = this.closest('.profile-card');
                const hiddenValues = card.querySelectorAll('.sensitive-field .hidden-value');
                const actualValues = card.querySelectorAll('.sensitive-field .actual-value');
                const btnText = this.querySelector('.btn-text');
                const icon = this.querySelector('i');
                
                if (isRevealed) {
                    hiddenValues.forEach(el => el.style.display = 'inline');
                    actualValues.forEach(el => el.style.display = 'none');
                    btnText.textContent = 'Reveal Sensitive Info';
                    icon.className = 'fas fa-eye';
                } else {
                    hiddenValues.forEach(el => el.style.display = 'none');
                    actualValues.forEach(el => el.style.display = 'inline');
                    btnText.textContent = 'Hide Sensitive Info';
                    icon.className = 'fas fa-eye-slash';
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading direct reports:', error);
        document.getElementById('directReportsContent').innerHTML = '<p>Error loading direct reports.</p>';
    }
}

async function loadOtherProfilesSection() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        // Get direct reports to exclude them from "Other Employees"
        let directReportIds = [];
        try {
            const directReportsResponse = await fetch(`/api/users/${currentUser.id}/reports`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (directReportsResponse.ok) {
                const directReportsData = await directReportsResponse.json();
                directReportIds = directReportsData.reports.map(report => report.id);
            }
        } catch (error) {
            // User is not a manager, no direct reports
            console.log('User is not a manager, no direct reports to exclude');
        }
        
        // Filter out current user and direct reports
        const otherUsers = data.users.filter(user => 
            user.id !== currentUser.id && !directReportIds.includes(user.id)
        );
        
        if (otherUsers.length === 0) {
            document.getElementById('profilesContent').innerHTML = '<p>No other employees found.</p>';
            return;
        }
        
        // Check if current user is CEO
        const isCEO = currentUser.role === 'ceo';
        
        document.getElementById('profilesContent').innerHTML = `
            <div class="profile-grid">
                ${otherUsers.map(user => {
                    const hasSensitiveData = user.salary !== undefined || user.ssn !== undefined;
                    
                    return `
                        <div class="profile-card">
                            <h5>${user.firstName} ${user.lastName}</h5>
                            <div class="profile-info">
                                <div>
                                    <label>Location:</label>
                                    <span>${user.location || 'Not specified'}</span>
                                </div>
                                <div>
                                    <label>Role:</label>
                                    <span>${user.role}</span>
                                </div>
                                ${isCEO && hasSensitiveData ? `
                                    <div>
                                        <label>Salary:</label>
                                        <span class="sensitive-field" data-field="salary">
                                            <span class="hidden-value">*****</span>
                                            <span class="actual-value" style="display: none;">${user.salary ? '$' + user.salary.toLocaleString() : 'Not disclosed'}</span>
                                        </span>
                                    </div>
                                    <div>
                                        <label>SSN:</label>
                                        <span class="sensitive-field" data-field="ssn">
                                            <span class="hidden-value">*****</span>
                                            <span class="actual-value" style="display: none;">${user.ssn || 'Not disclosed'}</span>
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                            ${isCEO && hasSensitiveData ? `
                                <button class="toggle-sensitive-small" data-user-id="${user.id}">
                                    <i class="fas fa-eye"></i> <span class="btn-text">Reveal sensitive information</span>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        // Add event listeners for CEO sensitive info toggles
        if (isCEO) {
            document.querySelectorAll('#profilesContent .toggle-sensitive-small').forEach(btn => {
                btn.addEventListener('click', function() {
                    const isRevealed = this.querySelector('.btn-text').textContent === 'Hide Sensitive Info';
                    const card = this.closest('.profile-card');
                    const hiddenValues = card.querySelectorAll('.sensitive-field .hidden-value');
                    const actualValues = card.querySelectorAll('.sensitive-field .actual-value');
                    const btnText = this.querySelector('.btn-text');
                    const icon = this.querySelector('i');
                    
                    if (isRevealed) {
                        hiddenValues.forEach(el => el.style.display = 'inline');
                        actualValues.forEach(el => el.style.display = 'none');
                        btnText.textContent = 'Reveal sensitive information';
                        icon.className = 'fas fa-eye';
                    } else {
                        hiddenValues.forEach(el => el.style.display = 'none');
                        actualValues.forEach(el => el.style.display = 'inline');
                        btnText.textContent = 'Hide Sensitive Info';
                        icon.className = 'fas fa-eye-slash';
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error loading other profiles:', error);
        document.getElementById('profilesContent').innerHTML = '<p>Error loading profiles.</p>';
    }
}


async function loadMyRequests() {
    try {
        const response = await fetch('/api/timeoff/my-requests', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        const content = document.getElementById('requestsContent');
        if (data.requests.length === 0) {
            content.innerHTML = '<p>You have no time-off requests.</p>';
            return;
        }
        
        content.innerHTML = data.requests.map(request => `
            <div class="request-item ${request.status}">
                <div class="request-header">
                    <div class="request-user">My Request</div>
                    <div class="request-status status-${request.status}">${request.status}</div>
                </div>
                <div class="request-dates">
                    ${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}
                </div>
                <div class="request-reason">${request.reason || 'No reason provided'}</div>
                <div class="request-dates">
                    Submitted: ${new Date(request.createdAt).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading my requests:', error);
        document.getElementById('requestsContent').innerHTML = '<p>Error loading your requests.</p>';
    }
}

// Action functions
async function approveRequest(requestId) {
    try {
        const response = await fetch(`/api/timeoff/${requestId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Request approved successfully!', 'success');
            loadTimeOffRequests();
            loadPendingApprovals();
        } else {
            showMessage(data.error || 'Failed to approve request', 'error');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        showMessage('Failed to approve request', 'error');
    }
}

async function rejectRequest(requestId) {
    try {
        const response = await fetch(`/api/timeoff/${requestId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Request rejected successfully!', 'success');
            loadTimeOffRequests();
            loadPendingApprovals();
        } else {
            showMessage(data.error || 'Failed to reject request', 'error');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        showMessage('Failed to reject request', 'error');
    }
}

// Submit new time-off request
function showTimeOffForm() {
    // Remove any existing form
    const existingForm = document.querySelector('.timeoff-form');
    if (existingForm) {
        existingForm.remove();
    }
    
    const form = document.createElement('div');
    form.className = 'timeoff-form';
    form.innerHTML = `
        <div style="background: #f7fafc; padding: 20px; border-radius: 12px; margin-top: 20px;">
            <h4>Submit New Time-Off Request</h4>
            <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="startDate" class="form-control">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="date" id="endDate" class="form-control">
            </div>
            <div class="form-group">
                <label>Reason (Optional)</label>
                <textarea id="reason" class="form-control" placeholder="Enter reason for time off"></textarea>
            </div>
            <button class="btn submit-request-btn">Submit Request</button>
            <button class="btn btn-secondary cancel-request-btn">Cancel</button>
        </div>
    `;
    
    document.getElementById('requestsContent').appendChild(form);
}

async function submitTimeOffRequest() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value;
    
    if (!startDate || !endDate) {
        showMessage('Please select both start and end dates', 'error');
        return;
    }
    
    try {
        console.log('Submitting time-off request:', { startDate, endDate, reason });
        const response = await fetch('/api/timeoff', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ startDate, endDate, reason })
        });
        console.log('Response status:', response.status);
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Time-off request submitted successfully!', 'success');
            loadTimeOffRequests();
            loadMyRequests();
            loadPendingApprovals();
            
            // Remove the form
            const form = document.querySelector('.timeoff-form');
            if (form) form.remove();
        } else {
            showMessage(data.error || 'Failed to submit request', 'error');
        }
    } catch (error) {
        console.error('Error submitting request:', error);
        showMessage('Failed to submit request', 'error');
    }
}

// Load pending approvals for managers
async function loadPendingApprovals() {
    try {
        const response = await fetch('/api/timeoff/pending', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        const content = document.getElementById('approvalsContent');
        if (data.requests.length === 0) {
            content.innerHTML = '<p>No pending approvals found.</p>';
            return;
        }
        
        content.innerHTML = data.requests.map(request => `
            <div class="request-item ${request.status}">
                <div class="request-header">
                    <div class="request-user">${request.userName || 'Unknown User'}</div>
                    <div class="request-status status-${request.status}">${request.status}</div>
                </div>
                <div class="request-dates">
                    ${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}
                </div>
                <div class="request-reason">${request.reason || 'No reason provided'}</div>
                <div class="request-dates">
                    Submitted: ${new Date(request.createdAt).toLocaleDateString()}
                </div>
                <div class="request-actions">
                    <button class="btn btn-sm btn-success approve-btn" data-request-id="${request.id}">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger reject-btn" data-request-id="${request.id}">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading pending approvals:', error);
        document.getElementById('approvalsContent').innerHTML = '<p>Error loading pending approvals.</p>';
    }
}
