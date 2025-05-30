import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const RootContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(to right bottom, #3f51b5, #5c6bc0)', // Subtle gradient background
  padding: theme.spacing(2),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 450, // Slightly larger card
  width: '100%',
  padding: theme.spacing(4), // Increased padding
  boxShadow: theme.shadows[10], // Stronger, more defined shadow
  borderRadius: theme.shape.borderRadius * 2, // More rounded corners
  backgroundColor: theme.palette.background.paper,
}));

const StyledForm = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3), // Increased gap between form elements
}));

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootContainer>
      <StyledCard>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary.main">
            CloudStudy
          </Typography>
          <Typography variant="h6" gutterBottom align="center" color="textSecondary" sx={{ mb: 4 }}>
            Sign in to your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <StyledForm onSubmit={handleSubmit}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} // Rounded text fields
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} // Rounded text fields
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component="button" onClick={() => navigate('/register')} sx={{ fontWeight: 600 }}>
                  Register
                </Link>
              </Typography>
            </Box>
          </StyledForm>
        </CardContent>
      </StyledCard>
    </RootContainer>
  );
};

export default Login;