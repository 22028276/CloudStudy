import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, CssBaseline, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
}));

const StyledContent = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
  paddingTop: theme.spacing(10),
  paddingBottom: theme.spacing(4),
}));

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box>
      <CssBaseline />
      <StyledAppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CloudStudy
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </StyledAppBar>
      <StyledContent>
        <Container maxWidth="lg">
          {children}
        </Container>
      </StyledContent>
    </Box>
  );
};

export default Layout; 