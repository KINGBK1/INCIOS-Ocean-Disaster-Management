import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import SignUpPage from './components/Auth/SignUp/SignUp'
import { GoogleOAuthProvider } from '@react-oauth/google';
import UserDashboard from './components/Dashboard/UserDashboard';
import SignIn from './components/Auth/SignIn/SignIn';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './components/Auth/context/AuthContext';

const App = () => {
  return (
    <div>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
        <Router>
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/" element={<Navigate to="/signup" />} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          </Routes>
        </Router>
        </AuthProvider>
      </GoogleOAuthProvider>

    </div>
  )
}

export default App