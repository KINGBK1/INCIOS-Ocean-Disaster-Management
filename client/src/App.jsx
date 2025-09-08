import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignUpPage from './components/Auth/SignUp/SignUp';
import { GoogleOAuthProvider } from '@react-oauth/google';
import UserDashboard from './components/Dashboard/UserDashboard';
import SignIn from './components/Auth/SignIn/SignIn';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Reports from './components/Reports/Reports';
import { AuthProvider } from './components/Auth/context/AuthContext';

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/" element={<Navigate to="/signup" />} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
   npm install
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;