import asyncio
from bleak import BleakScanner, BleakClient
from datetime import datetime

async def connect_to_device(device_address):
    async with BleakClient(device_address) as client:
        print(f"Connected to {device_address}")
        # You can add more functionality here, like reading/writing characteristics

async def scan_bluetooth_devices():
    print("Scanning for bluetooth devices...")
    scan_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        devices = await BleakScanner.discover()
        
        print(f"\nScan completed at {scan_time}")
        print(f"Found {len(devices)} devices:\n")
        
        for index, device in enumerate(devices):
            print(f"{index + 1}: Device Name: {device.name or 'Unknown'}, MAC Address: {device.address}")
        
        # Prompt user to connect to a device
        if devices:
            choice = int(input("Select a device to connect (1 to {}): ".format(len(devices)))) - 1
            if 0 <= choice < len(devices):
                device_address = devices[choice].address
                await connect_to_device(device_address)
            else:
                print("Invalid selection.")
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")

async def main():
    print("Starting Bluetooth scan...")
    await scan_bluetooth_devices()

if __name__ == "__main__":
    # Run the async function
    asyncio.run(main())
