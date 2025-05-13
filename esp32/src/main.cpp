#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "esp_camera.h"
#include <EEPROM.h>
#include <ArduinoJson.h> // Optional: for easier JSON parsing/generation

// AI Thinker ESP32-CAM Pin Map
#define CAM_PIN_PWDN 32
#define CAM_PIN_RESET -1 // NC
#define CAM_PIN_XCLK 0
#define CAM_PIN_SIOD 26
#define CAM_PIN_SIOC 27
#define CAM_PIN_D7 35
#define CAM_PIN_D6 34
#define CAM_PIN_D5 39
#define CAM_PIN_D4 36
#define CAM_PIN_D3 21
#define CAM_PIN_D2 19
#define CAM_PIN_D1 18
#define CAM_PIN_D0 5
#define CAM_PIN_VSYNC 25
#define CAM_PIN_HREF 23
#define CAM_PIN_PCLK 22

// L298N Motor Driver Pins - Default, will be configurable
// These are examples, actual usable pins on ESP32-CAM are limited.
// Popular choices for L298N: GPIO12, GPIO13, GPIO14, GPIO15
// Ensure these pins are not used by camera or flash.
#define DEFAULT_IN1_PIN 12 // Left Motor Fwd
#define DEFAULT_IN2_PIN 13 // Left Motor Bwd
#define DEFAULT_IN3_PIN 14 // Right Motor Fwd
#define DEFAULT_IN4_PIN 15 // Right Motor Bwd

// PWM Channels (0-15)
#define LEFT_MOTOR_FWD_CHANNEL 0
#define LEFT_MOTOR_BWD_CHANNEL 1
#define RIGHT_MOTOR_FWD_CHANNEL 2
#define RIGHT_MOTOR_BWD_CHANNEL 3

#define PWM_FREQ 5000 // 5 kHz
#define PWM_RESOLUTION 8 // 8-bit resolution (0-255)

struct Config {
  char sta_ssid[33];
  char sta_password[65];
  char ap_ssid[33];
  char ap_password[65];
  uint8_t in1_pin;
  uint8_t in2_pin;
  uint8_t in3_pin;
  uint8_t in4_pin;
  bool config_saved; // Simple flag to check if config was ever saved
};

Config currentConfig;
const int EEPROM_SIZE = sizeof(Config);

AsyncWebServer server(80);

// Function to save configuration to EEPROM
void saveConfig() {
  Serial.println("Saving configuration to EEPROM...");
  currentConfig.config_saved = true;
  EEPROM.put(0, currentConfig);
  EEPROM.commit();
  Serial.println("Configuration saved.");
}

// Function to load configuration from EEPROM
void loadConfig() {
  Serial.println("Loading configuration from EEPROM...");
  EEPROM.get(0, currentConfig);
  if (!currentConfig.config_saved) { // Check if EEPROM has valid data, otherwise use defaults
    Serial.println("No valid config in EEPROM, loading defaults.");
    strcpy(currentConfig.ap_ssid, "RoverCam-Hotspot");
    strcpy(currentConfig.ap_password, "rover1234");
    strcpy(currentConfig.sta_ssid, "");
    strcpy(currentConfig.sta_password, "");
    currentConfig.in1_pin = DEFAULT_IN1_PIN;
    currentConfig.in2_pin = DEFAULT_IN2_PIN;
    currentConfig.in3_pin = DEFAULT_IN3_PIN;
    currentConfig.in4_pin = DEFAULT_IN4_PIN;
    currentConfig.config_saved = false; // Mark as not saved yet
    // Don't save defaults immediately, let user configure first.
  } else {
    Serial.println("Configuration loaded from EEPROM.");
  }
  Serial.printf("AP SSID: %s\n", currentConfig.ap_ssid);
  Serial.printf("Motor Pins: IN1=%d, IN2=%d, IN3=%d, IN4=%d\n", 
                currentConfig.in1_pin, currentConfig.in2_pin, currentConfig.in3_pin, currentConfig.in4_pin);
}


void setupMotorPins() {
    // Setup GPIOs for L298N
    pinMode(currentConfig.in1_pin, OUTPUT);
    pinMode(currentConfig.in2_pin, OUTPUT);
    pinMode(currentConfig.in3_pin, OUTPUT);
    pinMode(currentConfig.in4_pin, OUTPUT);

    // Configure PWM channels
    ledcSetup(LEFT_MOTOR_FWD_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcSetup(LEFT_MOTOR_BWD_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcSetup(RIGHT_MOTOR_FWD_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcSetup(RIGHT_MOTOR_BWD_CHANNEL, PWM_FREQ, PWM_RESOLUTION);

    // Attach pins to PWM channels
    ledcAttachPin(currentConfig.in1_pin, LEFT_MOTOR_FWD_CHANNEL);
    ledcAttachPin(currentConfig.in2_pin, LEFT_MOTOR_BWD_CHANNEL);
    ledcAttachPin(currentConfig.in3_pin, RIGHT_MOTOR_FWD_CHANNEL);
    ledcAttachPin(currentConfig.in4_pin, RIGHT_MOTOR_BWD_CHANNEL);

    Serial.println("Motor pins and PWM configured.");
}

// speed: -255 (full backward) to 255 (full forward)
void controlLeftMotor(int speed) {
  if (speed > 0) { // Forward
    ledcWrite(LEFT_MOTOR_FWD_CHANNEL, speed);
    ledcWrite(LEFT_MOTOR_BWD_CHANNEL, 0);
  } else if (speed < 0) { // Backward
    ledcWrite(LEFT_MOTOR_FWD_CHANNEL, 0);
    ledcWrite(LEFT_MOTOR_BWD_CHANNEL, -speed);
  } else { // Stop
    ledcWrite(LEFT_MOTOR_FWD_CHANNEL, 0);
    ledcWrite(LEFT_MOTOR_BWD_CHANNEL, 0);
  }
}

void controlRightMotor(int speed) {
  if (speed > 0) { // Forward
    ledcWrite(RIGHT_MOTOR_FWD_CHANNEL, speed);
    ledcWrite(RIGHT_MOTOR_BWD_CHANNEL, 0);
  } else if (speed < 0) { // Backward
    ledcWrite(RIGHT_MOTOR_FWD_CHANNEL, 0);
    ledcWrite(RIGHT_MOTOR_BWD_CHANNEL, -speed);
  } else { // Stop
    ledcWrite(RIGHT_MOTOR_FWD_CHANNEL, 0);
    ledcWrite(RIGHT_MOTOR_BWD_CHANNEL, 0);
  }
}


bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = CAM_PIN_D0;
  config.pin_d1 = CAM_PIN_D1;
  config.pin_d2 = CAM_PIN_D2;
  config.pin_d3 = CAM_PIN_D3;
  config.pin_d4 = CAM_PIN_D4;
  config.pin_d5 = CAM_PIN_D5;
  config.pin_d6 = CAM_PIN_D6;
  config.pin_d7 = CAM_PIN_D7;
  config.pin_xclk = CAM_PIN_XCLK;
  config.pin_pclk = CAM_PIN_PCLK;
  config.pin_vsync = CAM_PIN_VSYNC;
  config.pin_href = CAM_PIN_HREF;
  config.pin_sccb_sda = CAM_PIN_SIOD; // SDA and SIOD are the same
  config.pin_sccb_scl = CAM_PIN_SIOC; // SCL and SIOC are the same
  config.pin_pwdn = CAM_PIN_PWDN;
  config.pin_reset = CAM_PIN_RESET;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG; // or PIXFORMAT_RGB565, PIXFORMAT_YUV422

  // Frame size - QVGA for streaming is common
  // For higher quality, try FRAMESIZE_VGA or FRAMESIZE_SVGA if PSRAM is available and stable
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA; //FRAMESIZE_HVGA; //FRAMESIZE_SVGA;
    config.jpeg_quality = 10; //0-63 lower number means higher quality
    config.fb_count = 2; // Need 2 frame buffers for streaming
    config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  } else {
    config.frame_size = FRAMESIZE_QVGA; //FRAMESIZE_HVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
    config.grab_mode = CAMERA_GRAB_LATEST;
  }

  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }
  Serial.println("Camera initialized successfully.");

  sensor_t *s = esp_camera_sensor_get();
  // s->set_vflip(s, 1);       // Flip camera vertically
  // s->set_hmirror(s, 1);     // Mirror camera horizontally
  return true;
}


void startAPMode() {
  Serial.println("Starting AP Mode...");
  WiFi.softAP(currentConfig.ap_ssid, currentConfig.ap_password);
  Serial.print("AP IP address: ");
  Serial.println(WiFi.softAPIP());
}

void startSTAMode() {
    Serial.println("Starting STA Mode...");
    if (strlen(currentConfig.sta_ssid) == 0) {
        Serial.println("STA SSID not configured. Falling back to AP mode.");
        startAPMode();
        return;
    }

    WiFi.begin(currentConfig.sta_ssid, currentConfig.sta_password);
    Serial.print("Connecting to WiFi: ");
    Serial.println(currentConfig.sta_ssid);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) { // Try for 10 seconds
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected to WiFi!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFailed to connect to WiFi. Falling back to AP mode.");
        WiFi.disconnect(true); // Disconnect from STA
        WiFi.mode(WIFI_OFF);    // Turn off WiFi before changing mode
        delay(100);
        WiFi.mode(WIFI_AP);     // Set AP mode
        startAPMode();
    }
}


void handleControl(AsyncWebServerRequest *request) {
  int leftSpeed = 0;
  int rightSpeed = 0;

  if (request->hasParam("left")) {
    leftSpeed = request->getParam("left")->value().toInt();
  }
  if (request->hasParam("right")) {
    rightSpeed = request->getParam("right")->value().toInt();
  }

  // Clamp speeds to -255 to 255
  leftSpeed = constrain(leftSpeed, -255, 255);
  rightSpeed = constrain(rightSpeed, -255, 255);

  Serial.printf("Control: Left=%d, Right=%d\n", leftSpeed, rightSpeed);
  controlLeftMotor(leftSpeed);
  controlRightMotor(rightSpeed);

  request->send(200, "text/plain", "OK");
}

void handleStream(AsyncWebServerRequest *request) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
  size_t fb_len = 0;
  int64_t fr_start = esp_timer_get_time();

  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    request->send(500, "text/plain", "Camera capture failed");
    return;
  }

  AsyncWebServerResponse *response = request->beginResponse_P(200, "image/jpeg", fb->buf, fb->len);
  response->addHeader("Content-Disposition", "inline; filename=capture.jpg");
  response->addHeader("Cache-Control", "no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0");
  response->addHeader("Pragma", "no-cache");
  response->addHeader("Connection", "close");
  request->send(response);

  esp_camera_fb_return(fb);

  int64_t fr_end = esp_timer_get_time();
  Serial.printf("JPG: %uB %ums\n", (uint32_t)(fb_len), (uint32_t)((fr_end - fr_start) / 1000));
}

void handleGetConfig(AsyncWebServerRequest *request) {
    DynamicJsonDocument jsonDoc(512);
    jsonDoc["ap_ssid"] = currentConfig.ap_ssid;
    // Don't send passwords back to client
    jsonDoc["sta_ssid"] = currentConfig.sta_ssid;
    jsonDoc["in1_pin"] = currentConfig.in1_pin;
    jsonDoc["in2_pin"] = currentConfig.in2_pin;
    jsonDoc["in3_pin"] = currentConfig.in3_pin;
    jsonDoc["in4_pin"] = currentConfig.in4_pin;
    jsonDoc["ip_address"] = (WiFi.getMode() == WIFI_AP) ? WiFi.softAPIP().toString() : WiFi.localIP().toString();
    jsonDoc["wifi_mode"] = (WiFi.getMode() == WIFI_AP) ? "ap" : "sta";
    
    String jsonString;
    serializeJson(jsonDoc, jsonString);
    request->send(200, "application/json", jsonString);
}

void handleSetPins(AsyncWebServerRequest *request) {
    bool changed = false;
    if (request->hasParam("IN1")) {
        currentConfig.in1_pin = request->getParam("IN1")->value().toInt();
        changed = true;
    }
    if (request->hasParam("IN2")) {
        currentConfig.in2_pin = request->getParam("IN2")->value().toInt();
        changed = true;
    }
    if (request->hasParam("IN3")) {
        currentConfig.in3_pin = request->getParam("IN3")->value().toInt();
        changed = true;
    }
    if (request->hasParam("IN4")) {
        currentConfig.in4_pin = request->getParam("IN4")->value().toInt();
        changed = true;
    }

    if (changed) {
        Serial.printf("New Pin Config: IN1=%d, IN2=%d, IN3=%d, IN4=%d\n",
                      currentConfig.in1_pin, currentConfig.in2_pin, currentConfig.in3_pin, currentConfig.in4_pin);
        setupMotorPins(); // Re-initialize motor pins with new config
        saveConfig();
        request->send(200, "text/plain", "Pins updated. Restarting in 3s.");
        delay(3000);
        ESP.restart();
    } else {
        request->send(400, "text/plain", "No pin parameters provided.");
    }
}


void handleSetWifi(AsyncWebServerRequest *request) {
    String mode = "";
    String ssid = "";
    String pass = "";

    if (request->hasParam("mode", true)) { // POST parameter
        mode = request->getParam("mode", true)->value();
    }
    if (request->hasParam("ssid", true)) {
        ssid = request->getParam("ssid", true)->value();
    }
    if (request->hasParam("password", true)) {
        pass = request->getParam("password", true)->value();
    }
    
    Serial.printf("Set WiFi: mode=%s, ssid=%s\n", mode.c_str(), ssid.c_str());

    bool configChanged = false;
    if (mode == "sta") {
        if (ssid.length() > 0 && ssid.length() < 33) {
            strcpy(currentConfig.sta_ssid, ssid.c_str());
            configChanged = true;
        }
        if (pass.length() < 65) { // Allow empty password
            strcpy(currentConfig.sta_password, pass.c_str());
            configChanged = true; // Even if password is just cleared
        }
    } else if (mode == "ap") {
        if (ssid.length() > 0 && ssid.length() < 33) {
            strcpy(currentConfig.ap_ssid, ssid.c_str());
            configChanged = true;
        }
        if (pass.length() == 0 || (pass.length() >= 8 && pass.length() < 65)) {
             strcpy(currentConfig.ap_password, pass.c_str());
             configChanged = true;
        } else if (pass.length() > 0 && pass.length() < 8) {
            request->send(400, "text/plain", "AP password must be at least 8 characters or empty.");
            return;
        }
    } else {
        request->send(400, "text/plain", "Invalid mode.");
        return;
    }

    if (configChanged) {
        saveConfig();
        request->send(200, "text/plain", "WiFi settings saved. Restarting in 3s to apply.");
        delay(3000);
        ESP.restart();
    } else {
        request->send(200, "text/plain", "No changes applied.");
    }
}


void handleScanWifi(AsyncWebServerRequest *request) {
    Serial.println("Scanning WiFi networks...");
    int n = WiFi.scanNetworks();
    Serial.println("Scan complete.");

    DynamicJsonDocument jsonDoc(1024); // Adjust size as needed
    JsonArray networksArray = jsonDoc.to<JsonArray>();

    if (n == 0) {
        Serial.println("No networks found.");
    } else {
        Serial.printf("%d networks found:\n", n);
        for (int i = 0; i < n; ++i) {
            networksArray.add(WiFi.SSID(i));
            Serial.printf("%d: %s (%d)%s\n", i + 1, WiFi.SSID(i).c_str(), WiFi.RSSI(i), (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? " " : "*");
            delay(10); // Small delay for stability
        }
    }
    String jsonString;
    serializeJson(jsonDoc, jsonString);
    request->send(200, "application/json", jsonString);
    WiFi.scanDelete(); // Free scan results
}


void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\nRoverCam Starting...");

  EEPROM.begin(EEPROM_SIZE);
  loadConfig(); // Load config from EEPROM or set defaults

  if (!initCamera()) {
    Serial.println("Failed to initialize camera! Restarting...");
    delay(3000);
    ESP.restart();
  }
  
  setupMotorPins(); // Initialize motor pins based on loaded/default config

  // Determine WiFi mode based on stored STA SSID
  if (strlen(currentConfig.sta_ssid) > 0) {
      WiFi.mode(WIFI_STA);
      startSTAMode();
  } else {
      WiFi.mode(WIFI_AP);
      startAPMode();
  }


  // Web Server Routes
  server.on("/control", HTTP_GET, handleControl);
  server.on("/stream", HTTP_GET, handleStream); // Camera stream
  
  server.on("/getconfig", HTTP_GET, handleGetConfig);
  server.on("/setpins", HTTP_POST, handleSetPins); // Expects x-www-form-urlencoded
  server.on("/setwifi", HTTP_POST, handleSetWifi); // Expects x-www-form-urlencoded
  server.on("/scanwifi", HTTP_GET, handleScanWifi);


  // Serve a simple status page (optional, or PWA will handle UI)
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    String html = "<html><head><title>RoverCam ESP32</title></head><body>";
    html += "<h1>RoverCam ESP32</h1>";
    html += "<p>Status: Online</p>";
    html += "<p>IP: " + ((WiFi.getMode() == WIFI_AP) ? WiFi.softAPIP().toString() : WiFi.localIP().toString()) + "</p>";
    html += "<p><img src='/stream' width='320' height='240'></p>";
    html += "<p><a href='/control?left=100&right=100'>Forward</a> | ";
    html += "<a href='/control?left=-100&right=-100'>Backward</a> | ";
    html += "<a href='/control?left=0&right=0'>Stop</a></p>";
    html += "</body></html>";
    request->send(200, "text/html", html);
  });
  
  // Handle Not Found
  server.onNotFound([](AsyncWebServerRequest *request){
    request->send(404, "text/plain", "Not found");
  });

  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

  server.begin();
  Serial.println("HTTP server started.");
}

void loop() {
  // AsyncWebServer handles requests in callbacks, so loop can be minimal
  // Or used for other tasks if needed.
  delay(10); // Small delay to yield to other tasks
}
