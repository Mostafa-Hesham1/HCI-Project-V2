import React, { useState, useEffect } from 'react';
import { Container, Typography, AppBar, Toolbar, Button, Box, Card, CardContent } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Parallax, ParallaxProvider } from 'react-scroll-parallax';

const HomeScreen = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is logged in
    const loggedInPatient = JSON.parse(localStorage.getItem('patient'));
    if (loggedInPatient) {
      setIsLoggedIn(true);
      setPatient(loggedInPatient);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('patient');
    setIsLoggedIn(false);
    setPatient(null);
    navigate('/');
  };

  return (
    <ParallaxProvider>
      <AppBar position="static" style={{ background: '#5c67f2', width: '100%' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Recovery Hub
          </Typography>
          {isLoggedIn ? (
            <>
              <Button color="inherit" component={Link} to="/patient-exercise-dashboard" sx={{ borderRadius: 20 }}>
                My Exercises
              </Button>
              <Button color="inherit" onClick={handleLogout} sx={{ borderRadius: 20 }}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/doctor" sx={{ borderRadius: 20 }}>
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/login" sx={{ borderRadius: 20 }}>
                Login
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box my={4}>
          <Parallax speed={-10}>
            <Card raised sx={{ my: 2 }}>
              <CardContent>
                <Typography variant="h2" component="h1" gutterBottom>
                  Welcome to Recovery Hub
                </Typography>
              </CardContent>
            </Card>
          </Parallax>
          <Parallax speed={5}>
            <Card raised sx={{ my: 2 }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  A digital platform dedicated to managing and tracking your rehabilitation and recovery.
                </Typography>
                <Typography variant="body1" component="p">
                  Track your exercises, monitor your progress, and stay connected with your healthcare provider.
                </Typography>
              </CardContent>
            </Card>
          </Parallax>
        </Box>
        <footer>
          <Box mt={5} py={3} textAlign="center" borderTop={1} borderColor="grey.300">
            <Typography variant="body2" color="textSecondary">
              © 2024 Recovery Hub. All rights reserved.
            </Typography>
          </Box>
        </footer>
      </Container>
    </ParallaxProvider>
  );
};

export default HomeScreen;
