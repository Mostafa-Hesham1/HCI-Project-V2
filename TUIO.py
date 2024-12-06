import socket
<<<<<<< HEAD
import time
import threading
import bluetooth  # Import PyBluez

# Define server IP and port
host_ip = '0.0.0.0'  # Listen on all available interfaces
port = 65434

# Initialize the server socket and set it up to accept connections
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((host_ip, port)) 
server_socket.listen(1)  # Listen for 1 client connection at a time

client_socket = None
is_client_connected = False

# Define target MAC addresses
target_mac_addresses = {
    "SEhly": "F4:63:1F:0D:01:22",
    "Baraa": "A4:F6:E8:57:91:00",
    "A7AAAAAAAAAAA": "e2:d8:a9:4a:1b:1f",
    "sma3aaaat": "88:C9:E8:50:36:C6"
}

def socket_server():
    global client_socket, is_client_connected
    print(f"Server listening on {host_ip}:{port}...")

    try:
        # Wait for a client to connect
        client_socket, client_address = server_socket.accept()
        print(f"Connected to client at {client_address}")
        is_client_connected = True  # Mark client as connected

        while is_client_connected:
            try:
                # Receive data from the client
                data = client_socket.recv(1024)
                if data:
                    message = data.decode('utf-8')
                    print(f"Received from client: {message}")
                else:
                    break
            except Exception as e:
                print(f"An error occurred while receiving data: {e}")
                break
    except Exception as e:
        print(f"An error occurred in socket server: {e}")
    finally:
        # Clean up the connection
        if client_socket:
            client_socket.close()
        server_socket.close()
        is_client_connected = False
        print("Socket server closed")

def scan_bluetooth_devices():
    global is_client_connected

    # Wait until a client is connected before scanning
    while not is_client_connected:
        print("Waiting for client connection to start Bluetooth scan...")
        time.sleep(1)

    print("Scanning for Bluetooth devices...")

    try:
        # Discover Bluetooth devices using PyBluez
        devices = bluetooth.discover_devices(duration=8, lookup_names=True)

        print(f"\nFound {len(devices)} devices:\n")

        # Loop through found devices and check for target MAC addresses
        for addr, name in devices:
            device_info = f"Device Name: {name or 'Unknown'}, MAC Address: {addr}"
            print(device_info)

            # Check if the device is one of the targets
            for target_name, mac in target_mac_addresses.items():
                if addr == mac:
                    target_info = f"Target Device Found! Name: {target_name}, MAC Address: {addr}"
                    print(target_info)  # Print the target device info in the terminal
                    send_to_client(target_info)  # Send the target device info to the client
                    break  # Exit loop since we found a match
            else:
                print(f"Device {addr} is not a target device.")

    except Exception as e:
        print(f"An error occurred in Bluetooth scan: {str(e)}")

def send_to_client(message):
    try:
        if is_client_connected and client_socket:
            client_socket.send(message.encode('utf-8'))
            print(f"Sent to client: {message}")
        else:
            print("Client not connected, cannot send data.")
    except Exception as e:
        print(f"Error sending to client: {e}")

def main():
    print("Starting Bluetooth scan (after client connection)...")
    scan_bluetooth_devices()

if __name__ == "__main__":
    # Start the socket server in a separate thread
    server_thread = threading.Thread(target=socket_server)
    server_thread.start()

    # Run the main function for scanning Bluetooth devices
    main()
=======
import asyncio
import aiohttp
import json

async def send_rotation_event(message):
    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:5000/tuio_rotation', json={'rotationDirection': message}) as response:
            print(f"Sent rotate event: {message} to server, response: {response.status}")

async def send_click_event():
    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:5000/tuio_click') as response:
            print(f"Sent click event to server, response: {response.status}")

async def send_tuio_id(tuio_id):
    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:5000/api/tuio_event', json={'tuio_id': tuio_id}) as response:
            print(f"Sent TUIO ID: {tuio_id} to server, response: {response.status}")

async def send_marker_id(marker_id):
    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:5000/api/marker_event', json={'marker_id': marker_id}) as response:
            print(f"Sent marker ID: {marker_id} to server, response: {response.status}")

async def handle_client(conn):
    buffer = ""
    while True:
        data = conn.recv(1024)
        if not data:
            break

        buffer += data.decode('utf-8')
        messages = buffer.split('\n')
        buffer = messages.pop()

        for message in messages:
            if message.strip():
                print(f"Received message: {message.strip()}")
                if message.strip().startswith("tuio_id:"):
                    tuio_id = message.strip().split(":")[1]
                    await send_tuio_id(tuio_id)
                elif message.strip().startswith("marker_id:"):
                    marker_id = message.strip().split(":")[1]
                    await send_marker_id(marker_id)
                elif message.strip() in ["rotate_left", "rotate_right"]:
                    await send_rotation_event(message.strip())
                elif message.strip() == "click":
                    await send_click_event()
                if message.strip() == "exit":
                    break
    conn.close()

async def main():
    soc = socket.socket()
    hostname = "localhost"
    port = 65434
    soc.bind((hostname, port))
    soc.listen(5)
    print("Waiting for connections...")

    while True:
        conn, addr = await asyncio.get_event_loop().sock_accept(soc)
        print("Device connected:", addr)
        asyncio.create_task(handle_client(conn))

if __name__ == "__main__":
    asyncio.run(main())
>>>>>>> ecb890926c3dbf307ff4b828855b339c849d07f1
