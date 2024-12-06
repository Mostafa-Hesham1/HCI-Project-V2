import os
import face_recognition
import cv2
import numpy as np

# Folder where we'll find our training data (faces of known people)
DATASET_PATH = "faces"

# These will store the encoded faces and their corresponding names
known_face_encodings = []
known_face_names = []

def train_from_dataset(dataset_path):
    """
    Train the system by looking at the images in the dataset.
    Each folder should represent one person's name, and their photos go inside.
    """
    global known_face_encodings, known_face_names

    for person_name in os.listdir(dataset_path):
        person_folder = os.path.join(dataset_path, person_name)

        # Skip anything that isn’t a folder
        if not os.path.isdir(person_folder):
            continue

        # Go through each image in this folder
        for image_file in os.listdir(person_folder):
            image_path = os.path.join(person_folder, image_file)

            try:
                # Load the image and extract face encodings
                image = face_recognition.load_image_file(image_path)
                face_encodings = face_recognition.face_encodings(image)

                # If no face is found, we skip this image
                if not face_encodings:
                    print(f"Couldn't find a face in {image_path}. Skipping...")
                    continue

                # We take the first face found in the image (assuming only one face per photo)
                known_face_encodings.append(face_encodings[0])
                known_face_names.append(person_name)

                print(f"Trained with {person_name} from {image_path}")
            except Exception as e:
                print(f"Something went wrong with {image_path}: {e}")

def recognize_faces_in_image(image_path):
    """
    Look for faces in an image and try to figure out who they are.
    """
    try:
        # Load the image and find faces
        image = face_recognition.load_image_file(image_path)
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        # For each face, see if we recognize it
        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            name = "Unknown"  # Default if no match is found

            # Compare with known faces
            if known_face_encodings:
                matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
                if True in matches:
                    best_match_index = np.argmin(face_recognition.face_distance(known_face_encodings, face_encoding))
                    name = known_face_names[best_match_index]

            print(f"Found {name} at (Top: {top}, Right: {right}, Bottom: {bottom}, Left: {left})")

    except Exception as e:
        print(f"Couldn't process {image_path}: {e}")

def live_face_recognition():
    """
    Use your webcam to recognize faces in real-time.
    Press 'q' to quit the live recognition.
    """
    video_capture = cv2.VideoCapture(0)

    print("Starting live face recognition. Press 'q' to exit.")

    try:
        while True:
            # Capture a single frame from the webcam
            ret, frame = video_capture.read()
            if not ret:
                print("Couldn't access the camera. Exiting...")
                break

            # Convert the image to RGB (face_recognition expects this)
            rgb_frame = frame[:, :, ::-1]

            # Find faces in the frame
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

            for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                name = "Unknown"

                # Try to match the face
                if known_face_encodings:
                    matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
                    if True in matches:
                        best_match_index = np.argmin(face_recognition.face_distance(known_face_encodings, face_encoding))
                        name = known_face_names[best_match_index]

                # Draw a box around the face and label it
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

            # Show the live video
            cv2.imshow('Live Face Recognition', frame)

            # Break out of the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Exiting live recognition.")
                break
    finally:
        # Release the webcam and close any OpenCV windows
        video_capture.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    # Train the system with images in the dataset
    print("Training the model with faces from the dataset...")
    train_from_dataset(DATASET_PATH)

    # Test recognition on a specific image
    test_image_path = "path_to_test_image.jpg"  # Replace with your image path
    print("\nRecognizing faces in the test image...")
    recognize_faces_in_image(test_image_path)

    # Start live face recognition
    print("\nStarting live face recognition...")
    live_face_recognition()
