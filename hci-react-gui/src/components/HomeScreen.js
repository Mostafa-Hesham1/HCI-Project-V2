import React from 'react';
import { Container, Typography, AppBar, Toolbar, Button, Box, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { Parallax, ParallaxProvider } from 'react-scroll-parallax';

const HomeScreen = () => {
  return (
    <ParallaxProvider>
      <AppBar position="static" style={{ background: '#5c67f2', width: '100%' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Recovery Hub
          </Typography>
          <Button color="inherit" component={Link} to="/doctor" sx={{ borderRadius: 20 }}>
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/exercise-tracker" sx={{ borderRadius: 20 }}>
            Exercise Tracker
          </Button>
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
