import socket
import requests

# Set up the socket server
soc = socket.socket()
hostname = "localhost"
port = 65434
soc.bind((hostname, port))
soc.listen(5)
print("Waiting for connections...")

try:
    while True:
        conn, addr = soc.accept()
        print("Device connected:", addr)

        buffer = ""
        while True:
            data = conn.recv(1024)
            if not data:
                break

            # Decode the data and add it to the buffer
            buffer += data.decode('utf-8')

            # Split the buffer using the newline delimiter
            messages = buffer.split('\n')
            buffer = messages.pop()  # Keep the last part in case it's an incomplete message

            for message in messages:
                if message.strip():  # Only process non-empty messages
                    print(f"Received rotate event: {message.strip()}")

                    # Send the message to the Flask server via HTTP POST
                    requests.post('http://localhost:5000/tuio_event', json={'message': message.strip()})

                    if message.strip() == "exit":
                        break
        conn.close()
except Exception as e:
    print("Socket server error:", e)
finally:
    soc.close()
