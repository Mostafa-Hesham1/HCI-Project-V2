import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import io from 'socket.io-client';
import DoctorDashboard from './components/Doctor/DoctorDashboard';
import PatientDashboard from './components/Patient/PatientDashboard';
import PatientExerciseDashboard from './components/Patient/PatientExerciseDashboard'; // Import the new component
import HomeScreen from './components/HomeScreen';
import Login from './components/Login'; // Import the new Login component

const socket = io('http://localhost:5000');

function App() {
  const [tuioData, setTuioData] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to TUIO server');
    });

    socket.on('tuio_event', (data) => {
      console.log('Received TUIO message:', data);
      setTuioData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient-exercise-dashboard" element={<PatientExerciseDashboard />} /> {/* Add the new route */}
          <Route path="/login" element={<Login />} /> {/* Add the new login route */}
          <Route path="/" element={<HomeScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;