import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('rentmate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (formData) =>
  API.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const loginUser = (data) => API.post('/auth/login', data);
export const adminLogin = (data) => API.post('/admin/login', data);
export const managementLoginUser = (data) => API.post('/auth/management-login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) =>
  API.put('/users/update-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });

// OTP (Email verification during signup)
export const sendEmailOtp = (email, name) => API.post('/auth/send-email-otp', { email, name });
export const verifyEmailOtp = (email, otp) => API.post('/auth/verify-email-otp', { email, otp });

// Items
export const addItem = (formData) =>
  API.post('/items/add', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getItems = (params) => API.get('/items', { params });
export const getItemById = (id) => API.get(`/items/${id}`);
export const getMyListings = () => API.get('/items/my-items');
export const updateItem = (id, formData) =>
  API.put(`/items/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteItem = (id) => API.delete(`/items/${id}`);

// Bookings
export const requestBooking = (data) => API.post('/bookings/request', data);
export const getStudentBookings = () => API.get('/bookings/student');
export const getOwnerBookings = () => API.get('/bookings/owner');
export const updateBookingStatus = (id, status) => API.put(`/bookings/${id}/status`, { status });
export const finalizeBooking = (id) => API.put(`/bookings/${id}/finalize`);
export const acceptPayment = (id) => API.put(`/bookings/${id}/accept-payment`);

// Verification
export const getPendingVerifications = () => API.get('/verification/pending');
export const getAllVerifications = () => API.get('/verification/all');
export const approveVerification = (id, remarks) =>
  API.put(`/verification/approve/${id}`, { remarks });
export const rejectVerification = (id, remarks) =>
  API.put(`/verification/reject/${id}`, { remarks });

// User — Student details for management view
export const getAllStudentsForManagement = () => API.get('/users/students');
export const getStudentDetails = (id) => API.get(`/users/student/${id}`);
export const getManagementByBranch = (branch) => API.get(`/users/management/branch${branch ? `?branch=${branch}` : ''}`);

// Chat Uploads
export const uploadChatFile = (formData) =>
  API.post('/chat/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const markAsRead = (conversationId) => API.put(`/chat/read/${conversationId}`);

// ─── Chat ───────────────────────────────────────────────────────────────────
export const getMyConversations = () => API.get('/chat/conversations');
export const getConversationMessages = (userId) => API.get(`/chat/${userId}`);

// ─── Feedback ───────────────────────────────────────────────────────────────
export const submitFeedback = (formData) => API.post('/feedback', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getAllFeedbackAdmin = () => API.get('/feedback');
export const updateFeedbackStatusAdmin = (id, status) => API.put(`/feedback/${id}`, { status });
export const deleteFeedbackAdmin = (id) => API.delete(`/feedback/${id}`);

// Admin Panel — Factory User Accounts & Items
export const getAdminStats = () => API.get('/admin/stats');
export const getAllStudentsAdmin = () => API.get('/admin/students');
export const deleteStudentAdmin = (id) => API.delete(`/admin/students/${id}`);
export const getAllManagementUsersAdmin = () => API.get('/admin/management-users');
export const createManagementUserAdmin = (data) => API.post('/admin/management-users', data);
export const updateManagementUserAdmin = (id, data) => API.put(`/admin/management-users/${id}`, data);
export const deleteManagementUserAdmin = (id) => API.delete(`/admin/management-users/${id}`);
export const getAllItemsAdmin = () => API.get('/admin/items');
export const deleteItemAdmin = (id) => API.delete(`/admin/items/${id}`);

// Admin Panel — Requests & Reports
export const getAllRequestsAdmin = () => API.get('/admin/requests');
export const deleteRequestAdmin = (id) => API.delete(`/admin/requests/${id}`);
export const togglePinRequest = (id) => API.put(`/admin/requests/${id}/pin`);
export const getReportsAdmin = () => API.get('/admin/reports');
export const resolveReportAdmin = (id) => API.put(`/admin/reports/${id}/resolve`);
export const createAdminBanner = (formData) => API.post('/admin/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateBannerAdmin = (id, formData) => API.put(`/admin/banners/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Query Dashboard Requests
export const createItemRequest = (formData) => 
  API.post('/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getActiveRequests = (branch) => API.get(`/requests${branch ? `?branch=${branch}` : ''}`);
export const getRequestBanners = () => API.get('/requests/banners');
export const getRequestById = (id) => API.get(`/requests/${id}`);
export const getMyRequests = () => API.get('/requests/me');
export const closeItemRequest = (id) => API.put(`/requests/${id}/close`);
export const reportItemRequest = (id, reason) => API.post(`/requests/${id}/report`, { reason });
export const updateItemRequest = (id, data) => API.put(`/requests/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteItemRequest = (id) => API.delete(`/requests/${id}`);

export default API;
