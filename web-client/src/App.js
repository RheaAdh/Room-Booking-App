import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import LoginScreen from './components/LoginScreen';
import StatsScreen from './components/StatsScreen';
import SummaryScreen from './components/SummaryScreen';
import TransactionsScreen from './components/TransactionsScreen';
import RoomAvailabilityScreen from './components/RoomAvailabilityScreen';
import BookingScreen from './components/BookingScreen';
import CaretakerBookingScreen from './components/CaretakerBookingScreen';
import BookingGrid from './components/BookingGrid';
import RoomScreen from './components/RoomScreen';
import ExpenseScreen from './components/ExpenseScreen';
import ContactScreen from './components/ContactScreen';
import CaretakerContactScreen from './components/CaretakerContactScreen';
import BookingRequestsScreen from './components/BookingRequestsScreen';
import Layout from './components/Layout';
import CaretakerLayout from './components/CaretakerLayout';
import PublicApp from './components/PublicApp';

// Import context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, hasAccess } = useAuth();
  
  if (!user) {
    return <Navigate to="/adminpvt/login" replace />;
  }
  
  if (requiredRole && !hasAccess(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Owner Routes Component
const OwnerRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/adminpvt/stats" replace />} />
        <Route path="/stats" element={<StatsScreen />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="/transactions" element={<TransactionsScreen />} />
        <Route path="/room-availability" element={<RoomAvailabilityScreen />} />
        <Route path="/bookings" element={<BookingScreen />} />
        <Route path="/booking-grid" element={<BookingGrid />} />
        <Route path="/rooms" element={<RoomScreen />} />
        <Route path="/expenses" element={<ExpenseScreen />} />
        <Route path="/contacts" element={<ContactScreen />} />
        <Route path="/booking-requests" element={<BookingRequestsScreen />} />
      </Routes>
    </Layout>
  );
};

// Caretaker Routes Component
const CaretakerRoutes = () => {
  return (
    <CaretakerLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/adminpvt/summary" replace />} />
        <Route path="/summary" element={<SummaryScreen />} />
        <Route path="/room-availability" element={<RoomAvailabilityScreen />} />
        <Route path="/bookings" element={<CaretakerBookingScreen />} />
        <Route path="/contacts" element={<CaretakerContactScreen />} />
      </Routes>
    </CaretakerLayout>
  );
};

// Main App Routes Component
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes - Now at root */}
      <Route path="/*" element={<PublicApp />} />
      
      {/* Admin Routes - Now at /adminpvt */}
      <Route path="/adminpvt/login" element={<LoginScreen />} />
      <Route 
        path="/adminpvt/*" 
        element={
          <ProtectedRoute>
            {user?.role === 'OWNER' ? <OwnerRoutes /> : <CaretakerRoutes />}
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
