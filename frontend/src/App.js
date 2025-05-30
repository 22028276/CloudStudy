import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentAnalysis from './pages/DocumentAnalysis';
// Import the new PrivateRoute component
import PrivateRoute from './components/PrivateRoute';

// Tạo theme tùy chỉnh
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5', // Deeper blue
      light: '#757de8',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff4081', // Brighter pink/red for accents
      light: '#ff79b0',
      dark: '#c60055',
      contrastText: '#fff',
    },
    background: {
      default: '#f4f6f8', // Light grey background for overall app
      paper: '#ffffff', // White background for cards/papers
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // Prevent uppercase by default for buttons
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none', // Remove default button shadow for a cleaner look
          '&:hover': {
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 5px 15px', // Subtle shadow on hover
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // More rounded corners for cards/papers
          boxShadow: 'rgba(0, 0, 0, 0.08) 0px 4px 12px', // Lighter, more modern shadow
        },
      },
    },
    MuiCard: { // Add specific card styling
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'rgba(0, 0, 0, 0.08) 0px 4px 12px',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 'rgba(0, 0, 0, 0.15) 0px 8px 24px',
          },
        },
      },
    },
    MuiAlert: { // Style for alerts
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Component kiểm tra đã đăng nhập (PublicRoute remains here as it's specific to App.js routing logic)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes - Using the imported PrivateRoute */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <PrivateRoute>
                <DocumentAnalysis />
              </PrivateRoute>
            }
          />
          <Route
            path="/translate"
            element={
              <PrivateRoute>
                <DocumentAnalysis />
              </PrivateRoute>
            }
          />
          <Route
            path="/summarize"
            element={
              <PrivateRoute>
                <DocumentAnalysis />
              </PrivateRoute>
            }
          />
          {/* Redirect root to dashboard if logged in, or login if not */}
          <Route
            path="/"
            element={
              localStorage.getItem('token') ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          {/* Catch-all for undefined routes */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;