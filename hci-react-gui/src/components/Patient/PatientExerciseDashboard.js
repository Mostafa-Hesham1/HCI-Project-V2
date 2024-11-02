import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Typography, Card, CardContent, CardMedia, Button, Grid, Box, AppBar, Toolbar, Snackbar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MuiAlert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  transition: 'background-color 0.3s, transform 0.3s',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.05)',
  },
}));

const PatientExerciseDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(location.state?.patient || JSON.parse(localStorage.getItem('patient'))); // Retrieve patient data from state or local storage
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (patient && patient._id) {
      // Fetch patient's exercises data from the server
      axios.get(`http://localhost:5000/api/patients/${patient._id}/exercises`)
        .then(response => {
          setExercises(response.data);
        })
        .catch(error => {
          console.error('Error fetching exercises:', error);
        });
    }
  }, [patient]);

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setSnackbarMessage('Please select a video file to upload.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedFile);

    axios.post('http://localhost:5000/api/upload_exercise_video', formData)
      .then(response => {
        setSnackbarMessage('Video uploaded successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setDialogOpen(false);
      })
      .catch(error => {
        setSnackbarMessage('Error uploading video');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  if (!patient) {
    return (
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom>
          No patient data available. Please log in again.
        </Typography>
      </Container>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <AppBar position="static" style={{ background: '#5c67f2' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Patient Exercise Dashboard
          </Typography>
          <StyledButton
            variant="contained"
            color="secondary"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Home
          </StyledButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box my={4} flexGrow={1}>
          <Typography variant="h4" gutterBottom>
            {patient.name}'s Exercise Plan
          </Typography>
          <Typography variant="h6" gutterBottom>
            Injury: {patient.injury}
          </Typography>
          <Typography variant="h6" gutterBottom>
            You have {exercises.length} exercise{exercises.length !== 1 && 's'} today
          </Typography>
          {exercises.length > 0 && (
            <Grid container spacing={4} sx={{ flexGrow: 1 }}>
              <Grid item xs={12} sx={{ flexGrow: 1 }}>
                <StyledCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="video"
                    controls
                    muted
                    src={`http://localhost:5000/${exercises[currentExerciseIndex].video_url}`} // Ensure the video URL is correct
                    title={exercises[currentExerciseIndex].name}
                    sx={{ flexGrow: 1 }}
                  />
                  <CardContent>
                    <Typography variant="h5" component="div">
                      {exercises[currentExerciseIndex].name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {exercises[currentExerciseIndex].description}
                    </Typography>
                    <Typography variant="body1" component="div">
                      Sets: {exercises[currentExerciseIndex].default_sets}
                    </Typography>
                    <Typography variant="body1" component="div">
                      Reps: {exercises[currentExerciseIndex].default_reps}
                    </Typography>
                    <Box mt={2}>
                      <StyledButton variant="contained" color="primary" onClick={handleDialogOpen}>
                        Perform Exercise
                      </StyledButton>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between">
                <StyledButton
                  variant="contained"
                  color="primary"
                  disabled={currentExerciseIndex === 0}
                  onClick={handlePreviousExercise}
                >
                  Previous
                </StyledButton>
                <StyledButton
                  variant="contained"
                  color="primary"
                  disabled={currentExerciseIndex === exercises.length - 1}
                  onClick={handleNextExercise}
                >
                  Next
                </StyledButton>
              </Grid>
            </Grid>
          )}
        </Box>
      </Container>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Perform Exercise</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please upload a video while you are performing the exercise for {exercises[currentExerciseIndex]?.default_reps} reps to check if you are doing it the right way.
          </DialogContentText>
          <Box mt={2}>
            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="upload-video"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="upload-video">
              <StyledButton variant="contained" color="primary" component="span">
                Select Video
              </StyledButton>
            </label>
            {selectedFile && <Typography variant="body2" mt={1}>{selectedFile.name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <StyledButton onClick={handleDialogClose} color="primary">
            Cancel
          </StyledButton>
          <StyledButton onClick={handleUpload} color="primary">
            Upload Video
          </StyledButton>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default PatientExerciseDashboard;
