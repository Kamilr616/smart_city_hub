#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include "MCP23017.h"
#include <ArduinoJson.h>

#define I2C_SDA        21
#define I2C_SCL        22
#define MCP_ADDRESS_1 0x27
#define USE_SERIAL Serial
#define SSID "C111"
#define PASS "abcdefabcdef987654321"
#define URL "http://192.168.50.243:4200/api/state/iot/all"
#define TOKEN "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjQ0ZWUzNjQ0Njg5NTViZWQ1MjY3YTkiLCJuYW1lIjoidXNlcjFAdXNlcjEucGwiLCJyb2xlIjoiSG91c2VfMDEiLCJpc0FkbWluIjpmYWxzZSwiYWNjZXNzIjoiYXV0aCIsImlhdCI6MTcxNTc5MzYxNSwiZXhwIjoxNzE3MDAzMjE1fQ.U8xy3JBTOf32D-AGBQN5IuVjp3kzsK_hgGMgGHz0-fs" 

WiFiMulti wifiMulti;
MCP23017 mcp1(I2C_SDA,I2C_SCL); 


void setup() {

    USE_SERIAL.begin(115200);
    USE_SERIAL.println("START");
    USE_SERIAL.flush();
    delay(200);
  
    wifiMulti.addAP(SSID, PASS);
    mcp1.iodir(MCP23017_PORTA, MCP23017_IODIR_ALL_OUTPUT , MCP_ADDRESS_1);
    mcp1.iodir(MCP23017_PORTB, MCP23017_IODIR_ALL_OUTPUT , MCP_ADDRESS_1);
    mcp1.write_gpio(MCP23017_PORTA, 0x00, MCP_ADDRESS_1);
    mcp1.write_gpio(MCP23017_PORTB, 0X00, MCP_ADDRESS_1);
}

void writeExpanderPorts(const JsonArray& payload) {

    // Initialize variables to hold the port values
    uint8_t portAValue = 0;
    uint8_t portBValue = 0;

    // Set port values based on the payload
    for (size_t i = 0; i < 8; i++) {
        if (!payload[i].as<bool>()) {
            portAValue |= (1 << i); // Set the corresponding bit

        }
        if (!payload[i + 8].as<bool>()) {
            portBValue |= (1 << i); // Set the corresponding bit
        }
    }

    // Write to MCP23017 ports
    mcp1.write_gpio(MCP23017_PORTA, portAValue, MCP_ADDRESS_1);
    mcp1.write_gpio(MCP23017_PORTB, portBValue, MCP_ADDRESS_1);

    USE_SERIAL.printf("Port A: 0x%02X, Port B: 0x%02X\n", portAValue, portBValue);
}

void loop() {
    // wait for WiFi connection
    if((wifiMulti.run() == WL_CONNECTED)) {

        HTTPClient http;
        http.begin(URL);       
        http.addHeader("x-access-token", TOKEN);       
        int httpCode = http.GET();

        // httpCode will be negative on error
        if(httpCode > 0) {
            // HTTP header has been send and Server response header has been handled
            USE_SERIAL.printf("[HTTP] GET... code: %d\n", httpCode);

            // file found at server
            if(httpCode == HTTP_CODE_OK) {
                String payload = http.getString();
                USE_SERIAL.println(payload);
                // Allocate the JSON document
                // Use a StaticJsonDocument of sufficient size
                JsonDocument doc;
                DeserializationError error = deserializeJson(doc, payload);

                if (error) {
                    USE_SERIAL.print(F("deserializeJson() failed: "));
                    USE_SERIAL.println(error.f_str());
                    return;
                }
                // Get the array from the JSON document
                JsonArray array = doc.as<JsonArray>();

                // Write to expander ports based on payload
                writeExpanderPorts(array);
            }
        } 
        else {
          USE_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
        }
        http.end();
    }
    delay(150);
}
