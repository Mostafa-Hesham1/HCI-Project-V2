from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
from bson import ObjectId  # Import ObjectId
from config import Config
from routes.patients import patients_bp
from routes.injuries import injuries_bp
from routes.exercises import exercises_bp
import os

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB connection
client = MongoClient('mongodb+srv://mostafaahesham12:TtqslmSrekYVVjzy@hci.xfv9n.mongodb.net/recovery_hub?retryWrites=true&w=majority&appName=Hci')
db = client['recovery_hub']
patients_collection = db['patients']
injuries_collection = db['injuries']
exercises_collection = db['exercises']

def test_db_connection():
    try:
        print("Attempting to connect to the database...")
        collections = db.list_collection_names()
        print("Connected to the database. Collections:", collections)
    except Exception as e:
        print("Failed to connect to the database:", e)

# Register Blueprints
app.register_blueprint(patients_bp)
app.register_blueprint(injuries_bp)
app.register_blueprint(exercises_bp)

# Serve video files
@app.route('/videos/<path:filename>')
def serve_video(filename):
    video_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'videos')
    return send_from_directory(video_directory, filename)

# Handle rotation events
@app.route('/tuio_rotation', methods=['POST'])
def handle_rotation():
    data = request.json
    rotation_direction = data.get('rotationDirection')
    socketio.emit('rotate_event', {'direction': rotation_direction})
    return jsonify({"status": "success"}), 200

@app.route('/api/patients/login', methods=['POST'])
def patient_login():
    data = request.json
    name = data.get('name')
    code = data.get('code')
    patient = patients_collection.find_one({"name": name, "code": code})
    if patient:
        patient['_id'] = str(patient['_id'])  # Convert ObjectId to string
        return jsonify({"success": True, "patient": patient}), 200
    else:
        return jsonify({"success": False, "message": "Invalid name or code"}), 401

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

@app.route('/api/upload_exercise_video', methods=['POST'])
def upload_exercise_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video = request.files['video']
    if video.filename == '':
        return jsonify({"error": "No selected file"}), 400
    video.save(os.path.join('uploads', video.filename))
    return jsonify({"message": "Video uploaded successfully"}), 200

@app.route('/api/patient/plan', methods=['GET'])
def get_patient_plan():
    patient_id = request.args.get('patient_id')
    if not patient_id:
        return jsonify({"error": "Patient ID is required"}), 400
    try:
        patient = patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        patient['_id'] = str(patient['_id'])  # Convert ObjectId to string
        return jsonify(patient), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return "TUIO Server Running"

@app.route('/tuio_event', methods=['POST'])
def tuio_event():
    data = request.json
    print('Received TUIO message:', data['message'])
    # Emit the received message as an event directly
    socketio.emit('rotate_event', {'direction': data['message']})
    return "Message received", 200


if __name__ == '__main__':
    test_db_connection()
    socketio.run(app, host='0.0.0.0', port=5000)