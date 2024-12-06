import os
import face_recognition
import cv2
import numpy as np

# Initialize variables
known_face_encodings = []
known_face_names = []

# Path to your dataset
DATASET_PATH = "faces"  # Adjust this path as needed


def train_from_dataset(dataset_path):
    """Train the model using images stored in the dataset folder."""
    global known_face_encodings, known_face_names

    for person_name in os.listdir(dataset_path):
        person_folder = os.path.join(dataset_path, person_name)

        if not os.path.isdir(person_folder):
            continue

        # Loop through each image in the person's folder
        for filename in os.listdir(person_folder):
            image_path = os.path.join(person_folder, filename)

            try:
                # Load the image and encode the face
                image = face_recognition.load_image_file(image_path)
                face_encodings = face_recognition.face_encodings(image)

                if not face_encodings:
                    print(f"No face found in {image_path}. Skipping...")
                    continue

                # Assuming only the first face is used for encoding
                face_encoding = face_encodings[0]

                # Append encoding and label
                known_face_encodings.append(face_encoding)
                known_face_names.append(person_name)
                print(f"Trained on {person_name} from {image_path}")

            except Exception as e:
                print(f"Error processing {image_path}: {e}")


def detect_faces_in_image(image_path):
    """Detect faces in a given image and identify them."""
    try:
        # Load the image
        image = face_recognition.load_image_file(image_path)

        # Find face locations and encodings
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        face_names = []
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
            name = "Unknown"

            # Find the best match for the face
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            best_match_index = np.argmin(face_distances)
            if matches and matches[best_match_index]:
                name = known_face_names[best_match_index]

            face_names.append(name)

        # Display results
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            print(f"Found {name} at (Top: {top}, Right: {right}, Bottom: {bottom}, Left: {left})")

    except Exception as e:
        print(f"Error detecting faces in {image_path}: {e}")


def live_recognition():
    """Open webcam and perform real-time face recognition."""
    video_capture = cv2.VideoCapture(0)

    while True:
        ret, frame = video_capture.read()
        if not ret:
            break

        # Convert the image from BGR (OpenCV format) to RGB (face_recognition format)
        rgb_frame = frame[:, :, ::-1]

        # Find all the face locations and encodings in the frame
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
            name = "Unknown"

            # Find the best match for the face
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            best_match_index = np.argmin(face_distances)
            if matches and matches[best_match_index]:
                name = known_face_names[best_match_index]

            # Draw a rectangle around the face
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

            # Label the face with a name
            cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

        # Display the resulting frame
        cv2.imshow('Video', frame)

        # Break the loop on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    # Train the model from the dataset
    print("Training the model...")
    train_from_dataset(DATASET_PATH)

    # Test the model with an image
    test_image_path = "path_to_test_image.jpg"  # Replace with your test image path
    print("\nDetecting faces in test image...")
    detect_faces_in_image(test_image_path)

    # Start live recognition
    print("\nStarting live recognition...")
    live_recognition()
