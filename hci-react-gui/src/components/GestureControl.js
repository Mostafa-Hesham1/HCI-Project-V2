import React, { useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function GestureControl({ onNextExercise, onPreviousExercise, onPerformExercise, onNavigateHome }) {
    useEffect(() => {
        // Start gesture recognition automatically when component mounts
        startGestureRecognition();

        // Set up socket listener
        socket.on('gesture_event', handleGesture);

        // Cleanup on unmount
        return () => {
            stopGestureRecognition();
            socket.off('gesture_event', handleGesture);
        };
    }, []);

    const startGestureRecognition = async () => {
        try {
            const response = await fetch('/api/gesture/start', { method: 'POST' });
            const data = await response.json();
            if (data.status !== 'success') {
                console.error('Failed to start gesture recognition');
            }
        } catch (error) {
            console.error('Error starting gesture recognition:', error);
        }
    };

    const stopGestureRecognition = async () => {
        try {
            await fetch('/api/gesture/stop', { method: 'POST' });
        } catch (error) {
            console.error('Error stopping gesture recognition:', error);
        }
    };

    const handleGesture = (data) => {
        console.log('Gesture detected:', data.gesture);
        switch(data.gesture) {
            case 'thumbs_up':
                onNextExercise?.();
                break;
            case 'thumbs_down':
                onPreviousExercise?.();
                break;
            case 'swipe_right':
                onPerformExercise?.();
                break;
            case 'swipe_left':
                onNavigateHome?.();
                break;
            default:
                break;
        }
    };

    // No need to render any UI
    return null;
}

export default GestureControl;