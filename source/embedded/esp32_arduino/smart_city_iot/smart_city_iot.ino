#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "secrets.h"

#define I2C_SDA        21
#define I2C_SCL        22
#define USE_SERIAL Serial
constexpr uint8_t EXPANDER_COUNT = 6;
constexpr uint8_t MCP23017_PORT_A = 0x00;
constexpr uint8_t MCP23017_PORT_B = 0x01;
constexpr uint8_t MCP23017_IODIR_A = 0x00;
constexpr uint8_t MCP23017_GPIO_A = 0x12;
const uint8_t addresses[EXPANDER_COUNT] = {0x27, 0x26, 0x25, 0x24, 0x23, 0x22};

void initWire(uint8_t sda, uint8_t scl) {
    Wire.begin(sda, scl);
    Wire.setClock(100000);
}

void writeMcpRegister(uint8_t address, uint8_t registerAddress, uint8_t value) {
    Wire.beginTransmission(address);
    Wire.write(registerAddress);
    Wire.write(value);
    Wire.endTransmission();
}

void initExpanders() {
    for (uint8_t i = 0; i < EXPANDER_COUNT; i++) {
        uint8_t address = addresses[i];
        writeMcpRegister(address, MCP23017_IODIR_A + MCP23017_PORT_A, 0x00);
        writeMcpRegister(address, MCP23017_IODIR_A + MCP23017_PORT_B, 0x00);
        writeMcpRegister(address, MCP23017_GPIO_A + MCP23017_PORT_A, 0x00);
        writeMcpRegister(address, MCP23017_GPIO_A + MCP23017_PORT_B, 0x00);
    }
}

void writeExpanderPorts(const JsonArray &payload)
{
    uint8_t portValues[12] = {0};

    for (size_t i = 0; i < 96; i++)
    {
        size_t portIndex = i / 8;
        size_t bitIndex = i % 8;

        if (!payload[i].as<bool>())
        {
            portValues[portIndex] |= (1 << bitIndex);
        }
    }

    for (uint8_t i = 0; i < EXPANDER_COUNT; i++)
    {
        writeMcpRegister(addresses[i], MCP23017_GPIO_A + MCP23017_PORT_A, portValues[2*i]);
        writeMcpRegister(addresses[i], MCP23017_GPIO_A + MCP23017_PORT_B, portValues[2*i + 1]);
    }

    for (uint8_t i = 0; i < EXPANDER_COUNT; i++)
    {
        USE_SERIAL.printf("Port A%u: 0x%02X, Port B%u: 0x%02X\n", i, portValues[2*i], i, portValues[2*i + 1]);
    }
}

void setup() {
    USE_SERIAL.begin(9600);
    USE_SERIAL.flush();
    delay(100);
    USE_SERIAL.println("START");

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        USE_SERIAL.println("Connecting to WiFi...");
    }

    USE_SERIAL.println("Connected to WiFi");    
    initWire(I2C_SDA, I2C_SCL);
    initExpanders();
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(API_URL);
        http.addHeader("x-access-token", API_TOKEN);
        int httpCode = http.GET();

        if(httpCode > 0) {
            USE_SERIAL.printf("[HTTP] GET... code: %d\n", httpCode);

            if(httpCode == HTTP_CODE_OK) {
                String payload = http.getString();
                //USE_SERIAL.println(payload);
                JsonDocument doc;
                DeserializationError error = deserializeJson(doc, payload);

                if (error) {
                    USE_SERIAL.print(F("deserializeJson() failed: "));
                    USE_SERIAL.println(error.f_str());
                } else if (!doc.is<JsonArray>() || doc.size() != 96) {
                    USE_SERIAL.println(F("Invalid state payload: expected exactly 96 entries"));
                } else {
                    JsonArray array = doc.as<JsonArray>();
                    writeExpanderPorts(array);
                }
            }
        } 
        else {
          USE_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
        }
        http.end();
    }
    delay(150);
}
