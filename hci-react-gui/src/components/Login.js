import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();

  const handleLogin = () => {
    axios.post('http://localhost:5000/api/patients/login', { name, code })
      .then(response => {
        localStorage.setItem('patient', JSON.stringify(response.data.patient));
        setSnackbarMessage('Login successful');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        navigate('/patient-exercise-dashboard', { state: { patient: response.data.patient } });
      })
      .catch(error => {
        setSnackbarMessage('Invalid name or code');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Login
        </Typography>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Code"
          fullWidth
          margin="normal"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login
          </Button>
        </Box>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <MuiAlert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Login;
