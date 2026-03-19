import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ManagementLogin from './pages/ManagementLogin';
import BrowseItems from './pages/BrowseItems';
import ItemDetails from './pages/ItemDetails';
import StudentDashboard from './pages/StudentDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import AddItem from './pages/AddItem';
import MyListings from './pages/MyListings';
import MyRentals from './pages/MyRentals';
import VerificationRequests from './pages/VerificationRequests';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfile from './pages/PublicProfile';
import QueryDashboard from './pages/QueryDashboard';
import AddRequest from './pages/AddRequest';
import RequestDetails from './pages/RequestDetails';
import SubmitFeedback from './pages/SubmitFeedback';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminManagement from './pages/admin/AdminManagement';
import AdminStudents from './pages/admin/AdminStudents';
import AdminItems from './pages/admin/AdminItems';
import AdminRequests from './pages/admin/AdminRequests';
import AdminFeedback from './pages/admin/AdminFeedback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/management-login" element={<ManagementLogin />} />
              <Route path="/browse" element={<BrowseItems />} />
              <Route path="/items/:id" element={<ItemDetails />} />
              <Route path="/messages" element={
                <ProtectedRoute allowedRoles={['student', 'management', 'admin']}>
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['student', 'management', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/user/:id" element={
                <ProtectedRoute allowedRoles={['student', 'management', 'admin']}>
                  <PublicProfile />
                </ProtectedRoute>
              } />
              {/* Public routes continue below */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['student', 'admin']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/query-dashboard" element={
                <ProtectedRoute allowedRoles={['student', 'management', 'admin']}>
                  <QueryDashboard />
                </ProtectedRoute>
              } />
              <Route path="/request/:id" element={
                <ProtectedRoute allowedRoles={['student', 'management', 'admin']}>
                  <RequestDetails />
                </ProtectedRoute>
              } />
              <Route path="/add-item" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <AddItem />
                </ProtectedRoute>
              } />
              <Route path="/add-request" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <AddRequest />
                </ProtectedRoute>
              } />
              <Route path="/my-listings" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyListings />
                </ProtectedRoute>
              } />
              <Route path="/my-rentals" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MyRentals />
                </ProtectedRoute>
              } />
              <Route path="/feedback" element={
                <ProtectedRoute allowedRoles={['student', 'management', 'admin']}>
                  <SubmitFeedback />
                </ProtectedRoute>
              } />

              {/* Management Protected */}
              <Route path="/management-dashboard" element={
                <ProtectedRoute allowedRoles={['management', 'admin']}>
                  <ManagementDashboard />
                </ProtectedRoute>
              } />
              <Route path="/verification-requests" element={
                <ProtectedRoute allowedRoles={['management', 'admin']}>
                  <VerificationRequests />
                </ProtectedRoute>
              } />

              {/* Admin Public Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Protected */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/management" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/students" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminStudents />
                </ProtectedRoute>
              } />
              <Route path="/admin/items" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminItems />
                </ProtectedRoute>
              } />
              <Route path="/admin/requests" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRequests />
                </ProtectedRoute>
              } />
              <Route path="/admin/feedback" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminFeedback />
                </ProtectedRoute>
              } />

              {/* 404 */}
              <Route path="*" element={
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                  <div className="text-7xl mb-4">🔍</div>
                  <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Page Not Found</h1>
                  <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
                  <a href="/" className="btn-primary px-6 py-2.5">Go Home</a>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', background: '#1e293b', color: '#f1f5f9', fontSize: '14px' },
            success: { style: { background: '#064e3b', color: '#d1fae5' } },
            error: { style: { background: '#7f1d1d', color: '#fee2e2' } },
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
