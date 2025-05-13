# RoverCam ESP32 Firmware

This folder contains the firmware for the ESP32 (specifically tested with AI Thinker ESP32-CAM) that powers the RoverCam. It uses PlatformIO for building and uploading.

## Prerequisites

1.  **Visual Studio Code**: Download and install from [code.visualstudio.com](https://code.visualstudio.com/).
2.  **PlatformIO IDE Extension**:
    *   Open VS Code.
    *   Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X).
    *   Search for "PlatformIO IDE" and install it.
    *   Reload VS Code if prompted. PlatformIO will then install its core components, which might take a few minutes.

## Setup & Upload Instructions

1.  **Open Project in VS Code**:
    *   Open VS Code.
    *   Click on the PlatformIO icon in the VS Code activity bar (it looks like an Ant head).
    *   In the PlatformIO Home tab, click on "Open Project".
    *   Navigate to this `esp32` folder (the one containing `platformio.ini`) and click "Open".
    *   VS Code might ask if you trust the authors of the files in this folder. Click "Yes, I trust the authors".

2.  **Connect ESP32-CAM**:
    *   Ensure your ESP32-CAM is properly connected to your computer via a USB-to-Serial adapter (e.g., FTDI).
    *   **Important**: For uploading to ESP32-CAM, you typically need to:
        1.  Connect `GPIO0` to `GND` before powering on or pressing reset.
        2.  Press the reset button on the ESP32-CAM.
        3.  After uploading is complete, disconnect `GPIO0` from `GND` and press reset again for normal operation.

3.  **Configure `platformio.ini` (Optional - COM Port)**:
    *   PlatformIO usually auto-detects the COM port.
    *   If you have multiple serial devices or encounter upload issues, you might need to specify the `upload_port` and `monitor_port` in the `platformio.ini` file.
    *   You can find the correct COM port by checking your computer's Device Manager (Windows) or by running `ls /dev/tty.*` (macOS/Linux) in a terminal.
    *   Example:
        ```ini
        upload_port = COM3  ; For Windows
        ; upload_port = /dev/ttyUSB0 ; For Linux
        monitor_port = COM3 ; For Windows
        ; monitor_port = /dev/ttyUSB0 ; For Linux
        ```

4.  **Build Firmware**:
    *   In the PlatformIO toolbar at the bottom of the VS Code window, click the "Build" button (checkmark icon).
    *   Alternatively, open the PlatformIO sidebar, expand "PROJECT TASKS" for your environment (e.g., `esp32cam`), and click "Build".
    *   Observe the terminal output in VS Code for any compilation errors.

5.  **Upload Firmware**:
    *   Ensure `GPIO0` is connected to `GND` and the ESP32-CAM is in bootloader mode (press reset).
    *   In the PlatformIO toolbar, click the "Upload" button (right arrow icon).
    *   Alternatively, in the PlatformIO sidebar, click "Upload".
    *   Monitor the terminal. You should see connection attempts and then the upload progress.
    *   If successful, you'll see a "SUCCESS" message.

6.  **Run Firmware**:
    *   Disconnect `GPIO0` from `GND`.
    *   Press the reset button on the ESP32-CAM.

7.  **Monitor Serial Output**:
    *   In the PlatformIO toolbar, click the "Serial Monitor" button (plug icon).
    *   Alternatively, in the PlatformIO sidebar, click "Monitor".
    *   The default baud rate is set in `platformio.ini` (usually 115200). The serial monitor will display debug messages from the ESP32.

## Initial Connection

*   After flashing and resetting (with GPIO0 disconnected), the ESP32-CAM will start in Access Point (AP) mode.
*   Look for a Wi-Fi network named **"RoverCam-Hotspot"**.
*   Connect to this network. The default password is **"rover1234"**.
*   Once connected, open a web browser and go to `http://192.168.4.1`. This PWA application should then be able to communicate with the rover.

You can then use the Wi-Fi settings in the PWA to connect the rover to your local Wi-Fi network (STA mode). The motor pin configurations can also be set via the PWA. These settings will be saved to the ESP32's EEPROM.
