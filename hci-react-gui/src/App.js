import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import io from 'socket.io-client';
import DoctorDashboard from './components/Doctor/DoctorDashboard';
import PatientDashboard from './components/Patient/PatientDashboard';
import HomeScreen from './components/HomeScreen';

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
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/" element={<HomeScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;