from flask import Blueprint, request, jsonify
from models.patient import patients_collection
from models.injury import injuries_collection
from bson import ObjectId
import random

patients_bp = Blueprint('patients', __name__)

def generate_patient_code():
    # Generate a 4-digit random patient code
    return ''.join(random.choices('0123456789', k=4))

@patients_bp.route('/api/patients', methods=['GET', 'POST'])
def patients():
    if request.method == 'GET':
        try:
            patients = list(patients_collection.find({}, {'_id': 1, 'name': 1, 'injury': 1, 'exercises': 1, 'code': 1}))
            for patient in patients:
                patient['_id'] = str(patient['_id'])  # Convert ObjectId to string
                for exercise in patient.get('exercises', []):
                    if isinstance(exercise, dict) and '_id' in exercise:
                        exercise['_id'] = str(exercise['_id'])  # Convert ObjectId to string in exercises
            return jsonify(patients)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    elif request.method == 'POST':
        try:
            data = request.json
            patient_code = generate_patient_code()
            
            # Ensure no two patients have the same code
            existing_patient = patients_collection.find_one({"code": patient_code})
            while existing_patient:
                patient_code = generate_patient_code()
                existing_patient = patients_collection.find_one({"code": patient_code})
            
            patient = {
                "code": patient_code,
                "name": data["name"],
                "injury": data["injury"],
                "exercises": data["exercises"]  # List of exercises with sets and reps
            }
            result = patients_collection.insert_one(patient)
            patient['_id'] = str(result.inserted_id)  # Correctly retrieve the ObjectId and convert it
            return jsonify(patient), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@patients_bp.route('/api/patients/<patient_id>', methods=['PUT', 'DELETE'])
def update_or_delete_patient(patient_id):
    if request.method == 'PUT':
        try:
            data = request.json
            result = patients_collection.update_one({'_id': ObjectId(patient_id)}, {'$set': data})
            if result.matched_count == 0:
                return jsonify({"error": "Patient not found"}), 404
            updated_patient = patients_collection.find_one({'_id': ObjectId(patient_id)}, {'_id': 1, 'name': 1, 'injury': 1, 'exercises': 1, 'code': 1})
            updated_patient['_id'] = str(updated_patient['_id'])  # Convert ObjectId to string
            return jsonify(updated_patient), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    elif request.method == 'DELETE':
        try:
            result = patients_collection.delete_one({'_id': ObjectId(patient_id)})
            if result.deleted_count == 0:
                return jsonify({"error": "Patient not found"}), 404
            return jsonify({"message": "Patient deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@patients_bp.route('/api/patients/<patient_id>/exercises', methods=['GET'])
def get_patient_exercises(patient_id):
    try:
        patient = patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        injury = injuries_collection.find_one({"name": patient['injury']})
        if not injury:
            return jsonify({"error": "Injury not found"}), 404
        # Filter exercises based on the patient's assigned exercises
        assigned_exercises = {ex['name']: ex for ex in patient['exercises']}
        filtered_exercises = []
        for ex in injury['exercises']:
            if ex['name'] in assigned_exercises:
                filtered_exercise = {
                    'name': ex['name'],
                    'description': ex['description'],
                    'video_url': ex['video_url'],
                    'sets': assigned_exercises[ex['name']]['sets'],
                    'reps': assigned_exercises[ex['name']]['reps']
                }
                filtered_exercises.append(filtered_exercise)
        return jsonify(filtered_exercises), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

