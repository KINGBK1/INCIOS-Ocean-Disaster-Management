import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import SignUpPage from './components/Auth/SignUp/SignUp'
import { GoogleOAuthProvider } from '@react-oauth/google';
import Dashboard from './components/Dashboard/Dashboard';
import SignIn from './components/Auth/SignIn/SignIn';

const App = () => {
  return (
    <div>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Router>
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/" element={<Navigate to="/signup" />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Router>
      </GoogleOAuthProvider>

    </div>
  )
}

export default App