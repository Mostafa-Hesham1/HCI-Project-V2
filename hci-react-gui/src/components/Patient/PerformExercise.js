import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

const PerformExercise = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Perform Exercise
      </Typography>
      <Typography variant="body1" gutterBottom>
        Please upload a video while you are performing the exercise to check if you are doing it the right way.
      </Typography>
      <Box mt={2}>
        <input
          accept="video/*"
          style={{ display: 'none' }}
          id="upload-video"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="upload-video">
          <Button variant="contained" color="primary" component="span">
            Select Video
          </Button>
        </label>
        {selectedFile && <Typography variant="body2" mt={1}>{selectedFile.name}</Typography>}
      </Box>
      <Box mt={2}>
        <Button variant="contained" color="secondary" onClick={handleUpload}>
          Upload Video
        </Button>
      </Box>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default PerformExercise;
