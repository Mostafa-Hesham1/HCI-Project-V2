import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, TextField, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  MenuItem, Select, InputLabel, FormControl, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Grid, AppBar, Toolbar, Box
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; // Correct import statement
import AddIcon from '@mui/icons-material/Add'; // Correct import statement
import HomeIcon from '@mui/icons-material/Home'; // Import Home icon
import { styled } from '@mui/material/styles';
import io from 'socket.io-client'; // Import socket.io-client
import Autocomplete from '@mui/material/Autocomplete'; // Import Autocomplete
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.background.default,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]); // State for filtered patients
  const [selectedPatient, setSelectedPatient] = useState(null); // State for selected patient
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [newPatient, setNewPatient] = useState({ name: '', injury: '', exercises: [] });
  const [injuries, setInjuries] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedRow, setSelectedRow] = useState(0); // Add state for selected row
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // State for delete confirmation dialog
  const [patientToDelete, setPatientToDelete] = useState(null); // State for patient to delete
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Fetch patients data from the server
    axios.get('http://localhost:5000/api/patients')
      .then(response => {
        setPatients(response.data);
        setFilteredPatients(response.data); // Initialize filtered patients
      })
      .catch(error => {
        console.error('Error fetching patients:', error);
        if (error.response) {
          console.error('Error response:', error.response);
        }
      });

    // Fetch injuries data from the server
    axios.get('http://localhost:5000/api/injuries')
      .then(response => {
        // console.log('Fetched injuries:', response.data);
        setInjuries(response.data);
      })
      .catch(error => {
        console.error('Error fetching injuries:', error);
        if (error.response) {
          console.error('Error response:', error.response);
        }
      });

    // Establish WebSocket connection
    const socket = io('http://localhost:5000');

    socket.on('rotate_event', (data) => {
      console.log(`Received rotate event: ${data.direction}`);
      setFilteredPatients(prevFilteredPatients => {
        if (prevFilteredPatients.length > 0) {
          if (data.direction === 'rotate_right') {
            setSelectedRow(prevRow => (prevRow + 1) % prevFilteredPatients.length);
          } else if (data.direction === 'rotate_left') {
            setSelectedRow(prevRow => (prevRow - 1 + prevFilteredPatients.length) % prevFilteredPatients.length);
          }
        }
        return prevFilteredPatients;
      });
    });

    return () => {
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, []); // Remove filteredPatients.length dependency

  const handleSearchChange = (event, value) => {
    if (value) {
      const filtered = patients.filter(patient => patient.name.toLowerCase().includes(value.toLowerCase()));
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

  const handleSearchSelect = (event, value) => {
    if (value) {
      const selectedPatient = patients.find(patient => patient.name === value);
      if (selectedPatient) {
        setFilteredPatients([selectedPatient]); // Show only the selected patient
        setSelectedRow(0); // Reset selected row
        setSelectedPatient(selectedPatient); // Set the selected patient
      }
    } else {
      setFilteredPatients(patients); // Show all patients if no selection
      setSelectedPatient(null); // Clear the selected patient
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
    setCurrentPatientId(null);
    setNewPatient({ name: '', injury: '', exercises: [] });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'injury') {
      const selectedInjury = injuries.find(injury => injury.name === value);
      if (selectedInjury) {
        setFilteredExercises(selectedInjury.exercises);
      } else {
        setFilteredExercises([]);
      }
      setNewPatient({ ...newPatient, [name]: value, exercises: [] }); // Clear exercises when injury is changed
    } else {
      setNewPatient({ ...newPatient, [name]: value });
    }
  };

  const handleExerciseChange = (event) => {
    const { value } = event.target;
    setNewPatient({ ...newPatient, exercises: value });
  };

  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.injury || !newPatient.exercises.length) {
        setSnackbarMessage('Please fill in all fields and select at least one exercise.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
    }

    const selectedInjury = injuries.find(injury => injury.name === newPatient.injury);
    if (!selectedInjury) {
      console.error(`Injury not found: ${newPatient.injury}`);
      return;
    }

    const patientData = {
      ...newPatient,
      exercises: newPatient.exercises.map(exerciseName => {
        const exercise = selectedInjury.exercises.find(ex => ex.name === exerciseName);
        if (!exercise) {
          console.error(`Exercise not found: ${exerciseName}`);
          return null;
        }
        return {
          name: exercise.name,
          sets: exercise.default_sets,
          reps: exercise.default_reps
        };
      }).filter(exercise => exercise !== null)
    };

    // console.log("Patient data to send:", patientData);  // Add this line to log the patient data to be sent

    axios.post('http://localhost:5000/api/patients', patientData)
    .then(response => {
        setPatients([...patients, response.data]);
        setFilteredPatients([...patients, response.data]); // Update filtered patients
        setSnackbarMessage('Patient added successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setOpen(false); // Close the modal after successful operation
        setNewPatient({ name: '', injury: '', exercises: [] }); // Reset form
    })
    .catch(error => {
        console.error('Error adding patient:', error);
        if (error.response) {
          console.error('Error response:', error.response);
          setSnackbarMessage('Error adding patient: ' + error.response.data.error);
        } else {
          setSnackbarMessage('Error adding patient');
        }
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    });
  };

  const handleEditPatient = (patient) => {
    setIsEditing(true);
    setCurrentPatientId(patient._id);
    setNewPatient({
      name: patient.name,
      injury: patient.injury,
      exercises: patient.exercises.map(ex => ex.name)
    });
    const selectedInjury = injuries.find(injury => injury.name === patient.injury);
    if (selectedInjury) {
      setFilteredExercises(selectedInjury.exercises);
    } else {
      setFilteredExercises([]);
    }
    setOpen(true);
  };

  const handleUpdatePatient = () => {
    if (!newPatient.name || !newPatient.injury || !newPatient.exercises.length) {
        setSnackbarMessage('Please fill in all fields and select at least one exercise.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
    }

    const selectedInjury = injuries.find(injury => injury.name === newPatient.injury);
    if (!selectedInjury) {
      console.error(`Injury not found: ${newPatient.injury}`);
      return;
    }

    const patientData = {
      ...newPatient,
      exercises: newPatient.exercises.map(exerciseName => {
        const exercise = selectedInjury.exercises.find(ex => ex.name === exerciseName);
        if (!exercise) {
          console.error(`Exercise not found: ${exerciseName}`);
          return null;
        }
        return {
          name: exercise.name,
          sets: exercise.default_sets,
          reps: exercise.default_reps
        };
      }).filter(exercise => exercise !== null)
    };

    // console.log("Patient data to update:", patientData);  // Add this line to log the patient data to be updated

    axios.put(`http://localhost:5000/api/patients/${currentPatientId}`, patientData)
    .then(response => {
        const updatedPatients = patients.map(patient =>
          patient._id === currentPatientId ? response.data : patient
        );
        setPatients(updatedPatients);
        setFilteredPatients(updatedPatients); // Update filtered patients
        setSnackbarMessage('Patient updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setOpen(false); // Close the modal after successful operation
        setIsEditing(false);
        setCurrentPatientId(null);
        setNewPatient({ name: '', injury: '', exercises: [] }); // Reset form
    })
    .catch(error => {
        console.error('Error updating patient:', error);
        if (error.response) {
          console.error('Error response:', error.response);
          setSnackbarMessage('Error updating patient: ' + error.response.data.error);
        } else {
          setSnackbarMessage('Error updating patient');
        }
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    });
  };

  const handleDeletePatient = (patientId) => {
    axios.delete(`http://localhost:5000/api/patients/${patientId}`)
      .then(response => {
        setPatients(patients.filter(patient => patient._id !== patientId));
        setFilteredPatients(filteredPatients.filter(patient => patient._id !== patientId)); // Update filtered patients
        setSnackbarMessage('Patient deleted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      })
      .catch(error => {
        console.error('Error deleting patient:', error);
        if (error.response) {
          console.error('Error response:', error.response);
          setSnackbarMessage('Error deleting patient: ' + error.response.data.error);
        } else {
          setSnackbarMessage('Error deleting patient');
        }
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  };

  const handleOpenDeleteDialog = (patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (patientToDelete) {
      handleDeletePatient(patientToDelete._id);
      handleCloseDeleteDialog();
    }
  };

  return (
    <Container maxWidth="md">
      <AppBar position="static" style={{ background: '#5c67f2', marginBottom: '20px' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Doctor Dashboard
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ borderRadius: 20 }}
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={9}>
          <Autocomplete
            freeSolo
            options={patients.map(patient => patient.name)}
            onInputChange={handleSearchChange}
            onChange={handleSearchSelect} // Add this line
            renderInput={(params) => (
              <TextField {...params} label="Search Patient" variant="outlined" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
            fullWidth
          >
            Add Patient
          </Button>
        </Grid>
      </Grid>
      <Box sx={{ overflowX: 'auto', mt: 2 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient Code</TableCell> {/* Add this line */}
                <TableCell>Patient Name</TableCell>
                <TableCell>Injury</TableCell>
                <TableCell>Exercises</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient, index) => (
                <StyledTableRow key={patient._id} selected={index === selectedRow}>
                  <TableCell>{patient.code}</TableCell> {/* Add this line */}
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patient.injury}</TableCell>
                  <TableCell>{patient.exercises.map(ex => ex.name).join(', ')}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEditPatient(patient)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleOpenDeleteDialog(patient)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isEditing ? 'Edit the details of the patient.' : 'Fill in the details of the new patient.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            name="name"
            fullWidth
            value={newPatient.name}
            onChange={handleChange}
          />
          <TextField
            select
            margin="dense"
            label="Injury"
            name="injury"
            fullWidth
            value={newPatient.injury}
            onChange={handleChange}
          >
            {injuries.map((injury) => (
              <MenuItem key={injury._id} value={injury.name}>
                {injury.name}
              </MenuItem>
            ))}
          </TextField>
          <FormControl fullWidth margin="dense">
            <InputLabel>Exercises</InputLabel>
            <Select
              multiple
              value={newPatient.exercises}
              onChange={handleExerciseChange}
              renderValue={(selected) => selected.join(', ')}
            >
              {filteredExercises.map((exercise, index) => (
                <MenuItem key={index} value={exercise.name}>
                  {exercise.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Cancel</Button>
          <Button onClick={isEditing ? handleUpdatePatient : handleAddPatient} color="primary">
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this patient?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="secondary">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default DoctorDashboard;