from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from pymongo import MongoClient
from config import Config
from routes.patients import patients_bp
from routes.injuries import injuries_bp
from routes.exercises import exercises_bp

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

# Handle rotation events
@app.route('/tuio_rotation', methods=['POST'])
def handle_rotation():
    data = request.json
    rotation_direction = data.get('rotationDirection')
    socketio.emit('rotate_event', {'direction': rotation_direction})
    return jsonify({"status": "success"}), 200



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