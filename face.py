import os
import face_recognition
import cv2
import numpy as np

# Constants
DATASET_PATH = "faces"  

# Known faces and their labels
known_face_encodings = []
known_face_names = []

def load_images_from_folder(folder):
    """Load images from a folder and return their paths."""
    return [
        os.path.join(folder, f) for f in os.listdir(folder) 
        if os.path.isfile(os.path.join(folder, f))
    ]

def train_from_dataset(dataset_path):
    """
    Train the model by encoding faces from the dataset folder.
    Each subfolder in the dataset path should correspond to one person.
    """
    global known_face_encodings, known_face_names

    for person_name in filter(lambda p: os.path.isdir(os.path.join(dataset_path, p)), os.listdir(dataset_path)):
        person_folder = os.path.join(dataset_path, person_name)

        for image_path in load_images_from_folder(person_folder):
            try:
                image = face_recognition.load_image_file(image_path)
                face_encodings = face_recognition.face_encodings(image)

                if face_encodings:
                    known_face_encodings.append(face_encodings[0])  # Use the first face encoding
                    known_face_names.append(person_name)
                    print(f"Trained on {person_name} from {image_path}")
                else:
                    print(f"No face found in {image_path}. Skipping...")

            except Exception as e:
                print(f"Error processing {image_path}: {e}")

def recognize_faces_in_image(image_path):
    """
    Detect and identify faces in a single image.
    """
    try:
        # Load image and detect faces
        image = face_recognition.load_image_file(image_path)
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        # Match detected faces
        face_names = [
            known_face_names[np.argmin(face_recognition.face_distance(known_face_encodings, encoding))]
            if matches := face_recognition.compare_faces(known_face_encodings, encoding) and True in matches
            else "Unknown"
            for encoding in face_encodings
        ]

        # Display results
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            print(f"Found {name} at (Top: {top}, Right: {right}, Bottom: {bottom}, Left: {left})")

    except Exception as e:
        print(f"Error detecting faces in {image_path}: {e}")

def live_face_recognition():
    """
    Open the webcam and perform live face recognition.
    """
    video_capture = cv2.VideoCapture(0)

    try:
        while True:
            ret, frame = video_capture.read()
            if not ret:
                break

            rgb_frame = frame[:, :, ::-1]  # Convert BGR to RGB

            # Detect faces in the frame
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

            for (top, right, bottom, left), encoding in zip(face_locations, face_encodings):
                matches = face_recognition.compare_faces(known_face_encodings, encoding)
                name = "Unknown"

                if matches and True in matches:
                    name = known_face_names[np.argmin(face_recognition.face_distance(known_face_encodings, encoding))]

                # Draw rectangle and label
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

            # Show the video feed
            cv2.imshow('Video', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        video_capture.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    print("Training the model...")
    train_from_dataset(DATASET_PATH)

    test_image_path = "path_to_test_image.jpg"  # Replace with your test image path
    print("\nDetecting faces in test image...")
    recognize_faces_in_image(test_image_path)

    print("\nStarting live recognition...")
    live_face_recognition()
