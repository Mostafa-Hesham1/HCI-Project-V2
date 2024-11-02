import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PatientDashboard = () => {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    // Fetch patient's plan data from the server
    axios.get('/api/patient/plan')
      .then(response => {
        setPlan(response.data);
      })
      .catch(error => {
        console.error('Error fetching plan:', error);
      });
  }, []);

  return (
    <div>
      <h2>Patient Dashboard</h2>
      {plan ? (
        <pre>{JSON.stringify(plan, null, 2)}</pre>
      ) : (
        <p>Loading plan...</p>
      )}
    </div>
  );
};

export default PatientDashboard;