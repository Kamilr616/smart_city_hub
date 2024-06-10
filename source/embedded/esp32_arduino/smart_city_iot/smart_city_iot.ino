#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include "MCP23017.h"
#include <ArduinoJson.h>

#define I2C_SDA        21
#define I2C_SCL        22
//#define ADDRESS_1 MCP_ADDRESS_27
#define USE_SERIAL Serial
#define SSID "C111"
#define PASS "abcdefabcdef987654321"
#define URL "http://192.168.50.243:4200/api/state/iot/all"
#define TOKEN "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjQ0ZWUzNjQ0Njg5NTViZWQ1MjY3YTkiLCJuYW1lIjoidXNlcjFAdXNlcjEucGwiLCJyb2xlIjoiSG91c2VfMDEiLCJpc0FkbWluIjpmYWxzZSwiYWNjZXNzIjoiYXV0aCIsImlhdCI6MTcxNTc5MzYxNSwiZXhwIjoxNzE3MDAzMjE1fQ.U8xy3JBTOf32D-AGBQN5IuVjp3kzsK_hgGMgGHz0-fs" 

WiFiMulti wifiMulti;
MCP23017 mcp1(I2C_SDA,I2C_SCL); 


void setup() {
    USE_SERIAL.begin(9600);
    USE_SERIAL.flush();
    delay(100);
    USE_SERIAL.println("START");

    wifiMulti.addAP(SSID, PASS);
    mcp1.iodir(MCP23017_PORTA, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_27);
    mcp1.iodir(MCP23017_PORTB, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_27);
    mcp1.iodir(MCP23017_PORTA, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_26);
    mcp1.iodir(MCP23017_PORTB, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_26);
    mcp1.iodir(MCP23017_PORTA, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_25);
    mcp1.iodir(MCP23017_PORTB, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_25);
    mcp1.iodir(MCP23017_PORTA, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_24);
    mcp1.iodir(MCP23017_PORTB, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_24);
    mcp1.iodir(MCP23017_PORTA, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_23);
    mcp1.iodir(MCP23017_PORTB, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_23);
    mcp1.iodir(MCP23017_PORTA, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_22);
    mcp1.iodir(MCP23017_PORTB, MCP23017_IODIR_ALL_OUTPUT , MCP23017_ADDRESS_22);

    mcp1.write_gpio(MCP23017_PORTA, 0x00, MCP23017_ADDRESS_27);
    mcp1.write_gpio(MCP23017_PORTB, 0X00, MCP23017_ADDRESS_27);
    mcp1.write_gpio(MCP23017_PORTA, 0x00, MCP23017_ADDRESS_26);
    mcp1.write_gpio(MCP23017_PORTB, 0X00, MCP23017_ADDRESS_26);
    mcp1.write_gpio(MCP23017_PORTA, 0x00, MCP23017_ADDRESS_25);
    mcp1.write_gpio(MCP23017_PORTB, 0X00, MCP23017_ADDRESS_25);
    mcp1.write_gpio(MCP23017_PORTA, 0x00, MCP23017_ADDRESS_24);
    mcp1.write_gpio(MCP23017_PORTB, 0X00, MCP23017_ADDRESS_24);
    mcp1.write_gpio(MCP23017_PORTA, 0x00, MCP23017_ADDRESS_23);
    mcp1.write_gpio(MCP23017_PORTB, 0X00, MCP23017_ADDRESS_23);
    mcp1.write_gpio(MCP23017_PORTA, 0x00, MCP23017_ADDRESS_22);
    mcp1.write_gpio(MCP23017_PORTB, 0X00, MCP23017_ADDRESS_22);
}

void writeExpanderPorts2(const JsonArray& payload) {
    // Initialize variables to hold the port values
    uint8_t portA0Value = 0;
    uint8_t portB0Value = 0;
    uint8_t portA1Value = 0;
    uint8_t portB1Value = 0;
    uint8_t portA2Value = 0;
    uint8_t portB2Value = 0;
    uint8_t portA3Value = 0;
    uint8_t portB3Value = 0;
    uint8_t portA4Value = 0;
    uint8_t portB4Value = 0;
    uint8_t portA5Value = 0;
    uint8_t portB5Value = 0;

    // Set port values based on the payload
    for (size_t i = 0; i < 8; i++) {
        if (!payload[i].as<bool>()) {
            portA0Value |= (1 << i); // Set the corresponding bit
        }
        if (!payload[i + 8].as<bool>()) {
            portB0Value |= (1 << i); // Set the corresponding bit
        }
         if (!payload[i + 16].as<bool>()) {
            portA1Value |= (1 << i); // Set the corresponding bit
        }
        if (!payload[i + 24].as<bool>()) {
            portB1Value |= (1 << i); // Set the corresponding bit
        }
       if (!payload[i + 32].as<bool>()) {
            portA2Value |= (1 << i); // Set the corresponding bit
        }
        if (!payload[i + 40].as<bool>()) {
            portB2Value |= (1 << i); // Set the corresponding bit
        }
        if (!payload[i + 48].as<bool>()) {
            portA3Value |= (1 << i); // Set the corresponding bit
        }
        if (!payload[i + 56].as<bool>()) {
            portB3Value |= (1 << i); // Set the corresponding bit
        }
    }

    // Write to MCP23017 ports
    mcp1.write_gpio(MCP23017_PORTA, portA0Value, MCP23017_ADDRESS_27);
    mcp1.write_gpio(MCP23017_PORTB, portB0Value, MCP23017_ADDRESS_27);
    mcp1.write_gpio(MCP23017_PORTA, portA1Value, MCP23017_ADDRESS_26);
    mcp1.write_gpio(MCP23017_PORTB, portB1Value, MCP23017_ADDRESS_26);
    mcp1.write_gpio(MCP23017_PORTA, portA2Value, MCP23017_ADDRESS_25);
    mcp1.write_gpio(MCP23017_PORTB, portB2Value, MCP23017_ADDRESS_25);
    mcp1.write_gpio(MCP23017_PORTA, portA3Value, MCP23017_ADDRESS_24);
    mcp1.write_gpio(MCP23017_PORTB, portB3Value, MCP23017_ADDRESS_24);

    USE_SERIAL.printf("Port A0: 0x%02X, Port B0: 0x%02X\n Port A1: 0x%02X, Port B1 : 0x%02X\n", portA0Value, portB0Value, portA1Value, portB1Value);
    USE_SERIAL.printf("Port A2: 0x%02X, Port B2: 0x%02X\n Port A3: 0x%02X, Port B3 : 0x%02X\n", portA2Value, portB2Value, portA3Value, portB3Value);
}

void writeExpanderPorts(const JsonArray& payload) {
    // Initialize variables to hold the port values
    uint8_t portValues[12] = {0};

    // Set port values based on the payload
    for (size_t i = 0; i < 96; i++) {
        size_t portIndex = i / 8;
        size_t bitIndex = i % 8;

        if (!payload[i].as<bool>()) {
            portValues[portIndex] |= (1 << bitIndex); // Set the corresponding bit
        }
    }

    // Write to MCP23017 ports
    mcp1.write_gpio(MCP23017_PORTA, portValues[0], MCP23017_ADDRESS_27);
    mcp1.write_gpio(MCP23017_PORTB, portValues[1], MCP23017_ADDRESS_27);
    mcp1.write_gpio(MCP23017_PORTA, portValues[2], MCP23017_ADDRESS_26);
    mcp1.write_gpio(MCP23017_PORTB, portValues[3], MCP23017_ADDRESS_26);
    mcp1.write_gpio(MCP23017_PORTA, portValues[4], MCP23017_ADDRESS_25);
    mcp1.write_gpio(MCP23017_PORTB, portValues[5], MCP23017_ADDRESS_25);
    mcp1.write_gpio(MCP23017_PORTA, portValues[6], MCP23017_ADDRESS_24);
    mcp1.write_gpio(MCP23017_PORTB, portValues[7], MCP23017_ADDRESS_24);
    mcp1.write_gpio(MCP23017_PORTA, portValues[8], MCP23017_ADDRESS_23);
    mcp1.write_gpio(MCP23017_PORTB, portValues[9], MCP23017_ADDRESS_23);
    mcp1.write_gpio(MCP23017_PORTA, portValues[10], MCP23017_ADDRESS_22);
    mcp1.write_gpio(MCP23017_PORTB, portValues[11], MCP23017_ADDRESS_22);

    USE_SERIAL.printf("Port A0: 0x%02X, Port B0: 0x%02X\n", portValues[0], portValues[1]);
    USE_SERIAL.printf("Port A1: 0x%02X, Port B1: 0x%02X\n", portValues[2], portValues[3]);
    USE_SERIAL.printf("Port A2: 0x%02X, Port B2: 0x%02X\n", portValues[4], portValues[5]);
    USE_SERIAL.printf("Port A3: 0x%02X, Port B3: 0x%02X\n", portValues[6], portValues[7]);
    USE_SERIAL.printf("Port A4: 0x%02X, Port B4: 0x%02X\n", portValues[8], portValues[9]);
    USE_SERIAL.printf("Port A5: 0x%02X, Port B5: 0x%02X\n", portValues[10], portValues[11]);
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
                //USE_SERIAL.println(payload);
                // Allocate the JSON document
                // Use a StaticJsonDocument of sufficient size
                JsonDocument doc;
                DeserializationError error = deserializeJson(doc, payload);

                if (error) {
                    USE_SERIAL.print(F("deserializeJson() failed: "));
                    USE_SERIAL.println(error.f_str());
                    return;
                }
                 //bool [] respond_arr = jsonToBool(doc)

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
