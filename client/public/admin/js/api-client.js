/**
 * Visteria InsightPulse AI — Unified API Client
 * Connects the new frontend designs to the existing backend Express APIs.
 * Supports dual portal sessions (employee / admin), automatic Bearer authorization,
 * httpOnly cookie session refresh on 401, and normalized error responses.
 */

(function (window) {
    'use strict';

    // Auto-detect base URL: If running via Vite proxy (port 5173), use relative /api.
    // If opened directly (file:/// or other local server), default to http://localhost:3000/api.
    const DEFAULT_BASE_URL = 'http://127.0.0.1:3000/api';
    const isFile = window.location.protocol === 'file:';
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    const API_BASE = window.__VISTERIA_API_BASE__ || (
        isFile ? DEFAULT_BASE_URL :
        !isLocalhost ? '/api' :
        ['3000', '5173'].includes(window.location.port) ? '/api' :
        DEFAULT_BASE_URL
    );

    const TOKEN_KEYS = {
        employee: 'employee_accessToken',
        admin: 'admin_accessToken'
    };

    function getToken(portal) {
        try {
            return localStorage.getItem(TOKEN_KEYS[portal] || TOKEN_KEYS.employee);
        } catch (e) {
            return null;
        }
    }

    function setToken(portal, token) {
        try {
            if (token) {
                localStorage.setItem(TOKEN_KEYS[portal] || TOKEN_KEYS.employee, token);
            } else {
                removeToken(portal);
            }
        } catch (e) {}
    }

    function removeToken(portal) {
        try {
            localStorage.removeItem(TOKEN_KEYS[portal] || TOKEN_KEYS.employee);
        } catch (e) {}
    }

    // Core HTTP Request function
    async function request(endpoint, options = {}, portal = null) {
        const isAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/register') || endpoint.includes('/reset-password') || endpoint.includes('/forgot-password');
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        const headers = options.headers ? { ...options.headers } : {};

        // Detect portal if not explicitly provided
        if (!portal) {
            if (endpoint.includes('/employee')) portal = 'employee';
            else if (endpoint.includes('/admin')) portal = 'admin';
        }

        // Attach Bearer token if portal is identified or token exists (skip for auth endpoints)
        if (portal && !isAuthEndpoint) {
            const token = getToken(portal);
            if (token && !headers['Authorization']) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Handle JSON bodies
        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(options.body);
        }

        const controller = new AbortController();
        const timeoutMs = options.timeout || 10000;
        const timeoutId = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs/1000}s`)), timeoutMs);

        const fetchOptions = {
            ...options,
            headers,
            signal: controller.signal,
            credentials: 'include'
        };

        try {
            let response;
            const fallbackUrl = `${DEFAULT_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
            try {
                response = await fetch(url, fetchOptions);
                if ((response.status === 502 || response.status === 503 || response.status === 504 || (!response.ok && !(response.headers.get('content-type') || '').includes('application/json'))) && url !== fallbackUrl && !endpoint.startsWith('http')) {
                    response = await fetch(fallbackUrl, { ...options, headers, credentials: 'include' });
                }
            } catch (fetchErr) {
                if (url !== fallbackUrl && !endpoint.startsWith('http')) {
                    try {
                        response = await fetch(fallbackUrl, { ...options, headers, credentials: 'include' });
                    } catch (fbErr) {
                        throw fetchErr;
                    }
                } else {
                    throw fetchErr;
                }
            }

            // If 401 Unauthorized and not a refresh call, attempt token refresh
            if (response.status === 401 && portal && !endpoint.includes('/refresh') && !isAuthEndpoint && !options._retried) {
                const refreshed = await tryRefreshToken(portal);
                if (refreshed) {
                    // Retry with new token
                    fetchOptions.headers['Authorization'] = `Bearer ${getToken(portal)}`;
                    fetchOptions._retried = true;
                    response = await fetch(url, fetchOptions);
                }
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return { ok: true, status: 204, data: null };
            }

            const contentType = response.headers.get('content-type') || '';
            let responseData;
            if (contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                let errorMessage;
                if (responseData && typeof responseData === 'object') {
                    errorMessage = responseData.error || responseData.message;
                    if (typeof errorMessage === 'object' && errorMessage !== null) {
                        errorMessage = errorMessage.message || JSON.stringify(errorMessage);
                    }
                } else if (typeof responseData === 'string' && responseData.trim() && !responseData.startsWith('<')) {
                    errorMessage = responseData.trim();
                }

                if (!errorMessage) {
                    if (response.status === 401) {
                        errorMessage = 'Invalid credentials. Please verify your Administrator Email/ID and password.';
                    } else if (response.status === 403) {
                        errorMessage = 'Access denied. You do not have administrator permissions.';
                    } else if (response.status === 404) {
                        errorMessage = 'Requested administrative resource not found.';
                    } else if (response.status === 502 || response.status === 503 || response.status === 504) {
                        errorMessage = 'The backend server is temporarily unavailable. Please verify the server is running.';
                    } else if (response.status >= 500) {
                        errorMessage = 'Server error occurred. Please verify backend service health.';
                    } else {
                        errorMessage = `Request failed (HTTP ${response.status})`;
                    }
                }

                const err = new Error(errorMessage);
                err.status = response.status;
                err.data = responseData;
                if (response.status === 0 || response.status === 502 || response.status === 503 || response.status === 504) {
                    err.isNetworkError = true;
                }
                throw err;
            }

            clearTimeout(timeoutId);
            return responseData;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError' || (err.message && err.message.includes('timed out'))) {
                const tErr = new Error('Connection timed out. The backend server did not respond within 10 seconds. Please verify the server is running.');
                tErr.status = 504;
                tErr.isNetworkError = true;
                throw tErr;
            }
            if (err.status !== undefined) throw err;
            // Network failure or backend unavailable
            const netErr = new Error('Unable to connect to the backend server. Please verify the server is running.');
            netErr.status = 0;
            netErr.isNetworkError = true;
            throw netErr;
        }
    }

    // Refresh token handler
    async function tryRefreshToken(portal) {
        try {
            const refreshUrl = `${API_BASE}/auth/${portal}/refresh`;
            const res = await fetch(refreshUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.accessToken) {
                    setToken(portal, data.accessToken);
                    return true;
                }
            }
        } catch (e) {}
        removeToken(portal);
        return false;
    }

    // High-Level API Methods
    const api = {
        baseUrl: API_BASE,

        // Auth Services
        auth: {
            // Public: List companies for registration dropdown
            async getCompanies() {
                return request('/auth/companies');
            },

            // Employee Auth
            async loginEmployee(employeeCode, companyName, password) {
                let payload;
                if (typeof employeeCode === 'object' && employeeCode !== null) {
                    payload = employeeCode;
                } else {
                    payload = { employeeCode, companyName, password };
                }
                const res = await request('/auth/employee/login', {
                    method: 'POST',
                    body: payload
                }, 'employee');
                if (res && res.accessToken) {
                    setToken('employee', res.accessToken);
                }
                return res;
            },

            async registerEmployee(data) {
                return request('/auth/employee/register', {
                    method: 'POST',
                    body: data
                });
            },

            async logoutEmployee() {
                try {
                    await request('/auth/employee/logout', { method: 'POST' }, 'employee');
                } finally {
                    removeToken('employee');
                    sessionStorage.removeItem('visteria_auth_user');
                }
            },

            async refreshEmployee() {
                return tryRefreshToken('employee');
            },

            // Admin Auth
            async getAdminStatus() {
                return request('/auth/admin/status');
            },

            async loginAdmin(email, password) {
                const res = await request('/auth/admin/login', {
                    method: 'POST',
                    body: { email, identifier: email, password }
                }, 'admin');
                if (res && res.accessToken) {
                    setToken('admin', res.accessToken);
                }
                return res;
            },

            async registerAdmin(data) {
                const res = await request('/auth/admin/register', {
                    method: 'POST',
                    body: data
                }, 'admin');
                if (res && res.accessToken) {
                    setToken('admin', res.accessToken);
                }
                return res;
            },

            async resetAdminPassword(identifier, newPassword) {
                const res = await request('/auth/admin/reset-password', {
                    method: 'POST',
                    body: { identifier, newPassword }
                }, 'admin');
                if (res && res.accessToken) {
                    setToken('admin', res.accessToken);
                }
                return res;
            },

            async verifyAdminInvitation(token, email) {
                return request('/auth/admin/verify-invitation', {
                    method: 'POST',
                    body: { token, email }
                });
            },

            async activateAdminAccount(token, email, password) {
                const res = await request('/auth/admin/activate-account', {
                    method: 'POST',
                    body: { token, email, password }
                });
                if (res && res.tokens && res.tokens.accessToken) {
                    setToken('admin', res.tokens.accessToken);
                } else if (res && res.accessToken) {
                    setToken('admin', res.accessToken);
                }
                return res;
            },

            async logoutAdmin() {
                try {
                    await request('/auth/admin/logout', { method: 'POST' }, 'admin');
                } finally {
                    removeToken('admin');
                }
            },

            async refreshAdmin() {
                return tryRefreshToken('admin');
            },

                        getEmployeeToken() {
                return getToken('employee');
            },
            clearEmployeeToken() {
                removeToken('employee');
            },
            getAdminToken() {
                return getToken('admin');
            },
            clearAdminToken() {
                removeToken('admin');
            }
        },

        // Employee Services
        employee: {
            async getProfile() {
                return request('/employee/me', { method: 'GET' }, 'employee');
            },

            async getAssignments() {
                return request('/employee/assignments', { method: 'GET' }, 'employee');
            },

            async startAssignment(assignmentId) {
                return request(`/employee/assignments/${assignmentId}/start`, {
                    method: 'POST'
                }, 'employee');
            },

            async submitResponse(assignmentId, answers) {
                return request(`/employee/assignments/${assignmentId}/submit`, {
                    method: 'POST',
                    body: { answers }
                }, 'employee');
            }
        },

        // Admin Services
        admin: {
            async getProfile() {
                return request('/admin/me', { method: 'GET' }, 'admin');
            },

            async getAdminUsers() {
                return request('/admin/users', { method: 'GET' }, 'admin');
            },

            async createAdminUser(data) {
                return request('/admin/users', {
                    method: 'POST',
                    body: data
                }, 'admin');
            },

            async deleteAdminUser(id) {
                return request(`/admin/users/${id}`, { method: 'DELETE' }, 'admin');
            },

            async getCompanies() {
                return request('/admin/companies', { method: 'GET' }, 'admin');
            },

            async getCompanyById(id) {
                return request(`/admin/companies/${id}`, { method: 'GET' }, 'admin');
            },

            async createCompany(formDataOrObject) {
                let options = { method: 'POST' };
                if (formDataOrObject instanceof FormData) {
                    options.body = formDataOrObject;
                } else {
                    options.body = formDataOrObject;
                }
                return request('/admin/companies', options, 'admin');
            },

            async updateCompany(id, formDataOrObject) {
                let options = { method: 'PATCH' };
                if (formDataOrObject instanceof FormData) {
                    options.body = formDataOrObject;
                } else {
                    options.body = formDataOrObject;
                }
                return request(`/admin/companies/${id}`, options, 'admin');
            },

            async deleteCompany(id, force = false) {
                const query = force ? '?force=true' : '';
                return request(`/admin/companies/${id}${query}`, { method: 'DELETE' }, 'admin');
            },

            async assignCompanyAdmin(companyId, email, name) {
                return request(`/admin/companies/${companyId}/assign-admin`, {
                    method: 'POST',
                    body: { email, name }
                }, 'admin');
            },

            async revokeCompanyAdmin(companyId, adminId) {
                return request(`/admin/companies/${companyId}/assign-admin/${adminId}`, {
                    method: 'DELETE'
                }, 'admin');
            },

            async getCompanyAdmins(companyId) {
                return request(`/admin/companies/${companyId}/admins`, {
                    method: 'GET'
                }, 'admin');
            },

            // Departments API
            async getDepartments() {
                return request('/admin/departments', { method: 'GET' }, 'admin');
            },

            async createDepartment(data) {
                return request('/admin/departments', {
                    method: 'POST',
                    body: data
                }, 'admin');
            },

            async deleteDepartment(idOrName) {
                return request(`/admin/departments/${encodeURIComponent(idOrName)}`, { method: 'DELETE' }, 'admin');
            },

            // Questions API
            async getQuestions(companyId) {
                const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
                return request(`/admin/questions${query}`, { method: 'GET' }, 'admin');
            },

            async createQuestion(data) {
                return request('/admin/questions', {
                    method: 'POST',
                    body: data
                }, 'admin');
            },

            async updateQuestion(id, data) {
                return request(`/admin/questions/${id}`, {
                    method: 'PATCH',
                    body: data
                }, 'admin');
            },

            async deleteQuestion(id) {
                return request(`/admin/questions/${id}`, { method: 'DELETE' }, 'admin');
            },

            // Surveys & Questions
            async getSurveys(companyId) {
                const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
                return request(`/admin/surveys${query}`, { method: 'GET' }, 'admin');
            },

            async createSurvey(data) {
                return request('/admin/surveys', {
                    method: 'POST',
                    body: data
                }, 'admin');
            },

            async getSurveyById(id) {
                return request(`/admin/surveys/${id}`, { method: 'GET' }, 'admin');
            },

            async updateSurvey(id, data) {
                return request(`/admin/surveys/${id}`, {
                    method: 'PATCH',
                    body: data
                }, 'admin');
            },

            async deleteSurvey(id) {
                return request(`/admin/surveys/${id}`, { method: 'DELETE' }, 'admin');
            },

            async deleteSurveyQuestion(surveyId, questionId) {
                return request(`/admin/surveys/${surveyId}/questions/${questionId}`, { method: 'DELETE' }, 'admin');
            },

            // Survey Cycles
            async getSurveyCycles(companyId) {
                const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
                return request(`/admin/survey-cycles${query}`, { method: 'GET' }, 'admin');
            },

            async getSurveyCycleById(id) {
                return request(`/admin/survey-cycles/${id}`, { method: 'GET' }, 'admin');
            },

            async createSurveyCycle(data) {
                return request('/admin/survey-cycles', {
                    method: 'POST',
                    body: data
                }, 'admin');
            },

            async updateSurveyCycle(id, data) {
                return request(`/admin/survey-cycles/${id}`, {
                    method: 'PATCH',
                    body: data
                }, 'admin');
            },

            async assignCycle(cycleId, companyId) {
                return request(`/admin/survey-cycles/${cycleId}/assign`, {
                    method: 'POST',
                    body: { company_id: companyId }
                }, 'admin');
            },

            async closeSurveyCycle(id) {
                return request(`/admin/survey-cycles/${id}`, {
                    method: 'PATCH',
                    body: { status: 'closed' }
                }, 'admin');
            },

            // AI Analysis
            async getAnalysis(cycleId) {
                return request(`/admin/survey-cycles/${cycleId}/analysis`, { method: 'GET' }, 'admin');
            },

            async triggerAnalysis(cycleId) {
                return request(`/admin/survey-cycles/${cycleId}/analyze`, { method: 'POST' }, 'admin');
            },

            // Survey Integrity
            async getCycleIntegrity(cycleId) {
                return request(`/admin/cycles/${cycleId}/integrity`, { method: 'GET' }, 'admin');
            },

            // Employees
            async getEmployees(companyId) {
                const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
                return request(`/admin/employees${query}`, { method: 'GET' }, 'admin');
            },
            async createEmployee(data) {
                return request('/admin/employees', { method: 'POST', body: data }, 'admin');
            },
            async updateEmployee(id, data) {
                return request(`/admin/employees/${id}`, { method: 'PATCH', body: data }, 'admin');
            },

            async getEmployeeSurveyStatus(employeeId) {
                return request(`/admin/employees/${employeeId}/survey-status`, { method: 'GET' }, 'admin');
            },

            async deleteEmployee(id) {
                return request(`/admin/employees/${id}`, { method: 'DELETE' }, 'admin');
            },

            async bulkDeleteEmployees(ids) {
                return request('/admin/employees/bulk-delete', {
                    method: 'POST',
                    body: { ids }
                }, 'admin');
            },

            // Responses
            async getResponses(companyId, cycleId) {
                const params = [];
                if (companyId) params.push(`company_id=${encodeURIComponent(companyId)}`);
                if (cycleId) params.push(`cycle_id=${encodeURIComponent(cycleId)}`);
                let query = params.length > 0 ? `?${params.join('&')}` : '';
                // cycleId already appended above
                return request(`/admin/responses${query}`, { method: 'GET' }, 'admin');
            },

            // Reports API
            async getReports() {
                return request('/admin/reports', { method: 'GET' }, 'admin');
            },

            async generateReport(cycleId) {
                return request(`/admin/survey-cycles/${cycleId}/report`, { method: 'POST' }, 'admin');
            },
            async deleteReport(reportId) {
                return request(`/admin/reports/${reportId}`, { method: 'DELETE' }, 'admin');
            },
            async sendReminderEmail(data) {
                return request('/admin/notifications/remind', { method: 'POST', body: data }, 'admin');
            },

            async downloadReport(reportId) {
                const token = getToken('admin');
                const url = `${API_BASE}/admin/reports/${reportId}/download`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    credentials: 'include'
                });
                if (!res.ok) throw new Error('Failed to download PDF report');
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `survey-report-${reportId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
                return { ok: true };
            },

            // Suggestions API
            async updateSuggestion(id, data) {
                return request(`/admin/suggestions/${id}`, {
                    method: 'PATCH',
                    body: data
                }, 'admin');
            },

            // Languages & Localization API
            async getSupportedLanguages() {
                return request('/admin/languages/registry', { method: 'GET' }, 'admin');
            },

            async getCompanyLanguages(companyId) {
                return request(`/admin/companies/${companyId}/languages`, { method: 'GET' }, 'admin');
            },

            async updateCompanyLanguages(companyId, data) {
                return request(`/admin/companies/${companyId}/languages`, {
                    method: 'PUT',
                    body: data
                }, 'admin');
            },

            async getCompanyTranslationStatus(companyId) {
                return request(`/admin/companies/${companyId}/translations`, { method: 'GET' }, 'admin');
            },

            async saveQuestionTranslations(questionId, translations) {
                return request(`/admin/questions/${questionId}/translations`, {
                    method: 'PUT',
                    body: { translations }
                }, 'admin');
            },

            async autoTranslateQuestion(questionId, targetLang) {
                return request(`/admin/questions/${questionId}/translate-auto`, {
                    method: 'POST',
                    body: { target_lang: targetLang }
                }, 'admin');
            }
        }
    };

    window.VisteriaAPI = api;
    window.api = api;
})(window);
