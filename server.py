from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
from bson import ObjectId
from config import Config
from routes.patients import patients_bp
from routes.injuries import injuries_bp
from routes.exercises import exercises_bp
from gesture_recognition.gesture_service import GestureService
import atexit
import os
import random
import string
import asyncio
import aiohttp
import subprocess

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize gesture service
gesture_service = GestureService(socketio)

# MongoDB connection
client = MongoClient('mongodb+srv://mostafaahesham12:TtqslmSrekYVVjzy@hci.xfv9n.mongodb.net/recovery_hub?retryWrites=true&w=majority&appName=Hci')
db = client['recovery_hub']
patients_collection = db['patients']
doctors_collection = db['doctors']
injuries_collection = db['injuries']
exercises_collection = db['exercises']

def init_app():
    print("Starting gesture recognition service...")
    gesture_service.start()
    test_db_connection()

def test_db_connection():
    try:
        print("Attempting to connect to the database...")
        collections = db.list_collection_names()
        print("Connected to the database. Collections:", collections)
    except Exception as e:
        print("Failed to connect to the database:", e)

def generate_random_name():
    return ''.join(random.choices(string.ascii_letters, k=8))

def generate_unique_tuio_id():
    existing_ids = set(patients_collection.distinct("tuio_id"))
    tuio_id = 50
    while tuio_id in existing_ids:
        tuio_id += 1
    return tuio_id

# Register Blueprints
app.register_blueprint(patients_bp, url_prefix='/api')
app.register_blueprint(injuries_bp)
app.register_blueprint(exercises_bp)

# Serve video files
@app.route('/videos/<path:filename>')
def serve_video(filename):
    video_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'videos')
    return send_from_directory(video_directory, filename)

# Gesture recognition endpoints
@app.route('/api/gesture/start', methods=['POST'])
def start_gesture():
    try:
        if not gesture_service.is_running:
            gesture_service.start()
        return jsonify({"status": "success", "message": "Gesture recognition started"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/gesture/stop', methods=['POST'])
def stop_gesture():
    try:
        if gesture_service.is_running:
            gesture_service.stop()
        return jsonify({"status": "success", "message": "Gesture recognition stopped"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Handle rotation events
@app.route('/tuio_rotation', methods=['POST'])
def handle_rotation():
    data = request.json
    rotation_direction = data.get('rotationDirection')
    print(f"Received rotation event: {rotation_direction}")
    socketio.emit('rotate_event', {'direction': rotation_direction})
    return jsonify({"status": "success"}), 200

# Handle click events
@app.route('/tuio_click', methods=['POST'])
def handle_click():
    print("Received click event")
    socketio.emit('click_event')
    return jsonify({"status": "success"}), 200

@app.route('/api/patients/login', methods=['POST'])
def patient_login():
    data = request.json
    tuio_id = int(data.get('tuio_id'))
    patient = patients_collection.find_one({"tuio_id": tuio_id})
    if patient:
        patient['_id'] = str(patient['_id'])
        return jsonify({"success": True, "patient": patient}), 200
    else:
        return jsonify({"success": False, "message": "Invalid TUIO ID"}), 401

@app.route('/api/doctors/login', methods=['POST'])
def doctor_login():
    data = request.json
    tuio_id = data.get('tuio_id')
    doctor = doctors_collection.find_one({"tuio_id": tuio_id})
    if doctor:
        doctor['_id'] = str(doctor['_id'])
        return jsonify({"success": True, "doctor": doctor}), 200
    else:
        return jsonify({"success": False, "message": "Invalid TUIO ID"}), 401

@app.route('/api/patients/<patient_id>/exercises', methods=['GET'])
def get_patient_exercises(patient_id):
    try:
        patient = patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        injury = injuries_collection.find_one({"name": patient['injury']})
        if not injury:
            return jsonify({"error": "Injury not found"}), 404
        exercises = injury.get('exercises', [])
        return jsonify(exercises), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/start_exercise', methods=['POST'])
def start_exercise():
    try:
        result = subprocess.run(['python', 'knee_flex.py'], capture_output=True, text=True, timeout=60)
        output = result.stdout.strip()
        return jsonify({"status": "success", "output": output}), 200
    except subprocess.TimeoutExpired:
        return jsonify({"status": "error", "message": "Exercise timed out"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/patient/plan', methods=['GET'])
def get_patient_plan():
    patient_id = request.args.get('patient_id')
    if not patient_id:
        return jsonify({"error": "Patient ID is required"}), 400
    try:
        patient = patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        patient['_id'] = str(patient['_id'])
        return jsonify(patient), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tuio_ids', methods=['GET'])
def get_tuio_ids():
    patient_ids = patients_collection.distinct("tuio_id")
    doctor_ids = doctors_collection.distinct("tuio_id")
    return jsonify(patient_ids + doctor_ids), 200

@app.route('/api/patients', methods=['POST'])
def create_patient():
    data = request.json
    name = data.get('name', generate_random_name())
    tuio_id = data.get('tuio_id', generate_unique_tuio_id())
    if tuio_id < 50 or patients_collection.find_one({"tuio_id": tuio_id}):
        return jsonify({"error": "Invalid or duplicate TUIO ID"}), 400
    patient = {
        "name": name,
        "tuio_id": tuio_id,
        "injury": data["injury"],
        "exercises": data["exercises"]
    }
    result = patients_collection.insert_one(patient)
    patient['_id'] = str(result.inserted_id)
    return jsonify(patient), 201

@app.route('/')
def index():
    return "Server Running with Gesture Recognition"

@atexit.register
def cleanup():
    print("Stopping gesture recognition service...")
    gesture_service.stop()

if __name__ == '__main__':
    print("Starting the Flask server with gesture recognition...")
    init_app()
    socketio.run(app, debug=True)
