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
#define TOKEN "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjY3NjgxMTZhMDYwMjJhYzViYzNhYzYiLCJuYW1lIjoiYWRtaW5AYWRtaW4ucGwiLCJyb2xlIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNzE4MDUyODg5LCJleHAiOjE3MjA2NDQ4ODl9.fk-aMPlXWVbsSfCPwybXg6IqbgDL6dyFs8Y0Icebe60"

WiFiMulti wifiMulti;
MCP23017 mcp1(I2C_SDA,I2C_SCL);


void initExpanders()    {
    mcp1.iodir(0x00, 0x00, 0x27);
    mcp1.iodir(0x01, 0x00, 0x27);
    mcp1.iodir(0x00, 0x00, 0x26);
    mcp1.iodir(0x01, 0x00, 0x26);
    mcp1.iodir(0x00, 0x00, 0x25);
    mcp1.iodir(0x01, 0x00, 0x25);
    mcp1.iodir(0x00, 0x00, 0x24);
    mcp1.iodir(0x01, 0x00, 0x24);
    mcp1.iodir(0x00, 0x00, 0x23);
    mcp1.iodir(0x01, 0x00, 0x23);
    mcp1.iodir(0x00, 0x00, 0x22);
    mcp1.iodir(0x01, 0x00, 0x22);

    mcp1.write_gpio(0x00, 0x00, 0x27);
    mcp1.write_gpio(0x01, 0X00, 0x27);
    mcp1.write_gpio(0x00, 0x00, 0x26);
    mcp1.write_gpio(0x01, 0X00, 0x26);
    mcp1.write_gpio(0x00, 0x00, 0x25);
    mcp1.write_gpio(0x01, 0X00, 0x25);
    mcp1.write_gpio(0x00, 0x00, 0x24);
    mcp1.write_gpio(0x01, 0X00, 0x24);
    mcp1.write_gpio(0x00, 0x00, 0x23);
    mcp1.write_gpio(0x01, 0X00, 0x23);
    mcp1.write_gpio(0x00, 0x00, 0x22);
    mcp1.write_gpio(0x01, 0X00, 0x22);
}
void writeExpanderPorts(const JsonArray &payload)
{
    // Initialize variables to hold the port values
    uint8_t portValues[12] = {0};

    // Set port values based on the payload
    for (size_t i = 0; i < 96; i++)
    {
        size_t portIndex = i / 8;
        size_t bitIndex = i % 8;

        if (!payload[i].as<bool>())
        {
            portValues[portIndex] |= (1 << bitIndex); // Set the corresponding bit
        }
    }

    mcp1.write_gpio(0x00, portValues[0], 0x27);
    mcp1.write_gpio(0x01, portValues[1], 0x27);
    mcp1.write_gpio(0x00, portValues[2], 0x26);
    mcp1.write_gpio(0x01, portValues[3], 0x26);
    mcp1.write_gpio(0x00, portValues[4], 0x25);
    mcp1.write_gpio(0x01, portValues[5], 0x25);
    mcp1.write_gpio(0x00, portValues[6], 0x24);
    mcp1.write_gpio(0x01, portValues[7], 0x24);
    mcp1.write_gpio(0x00, portValues[8], 0x23);
    mcp1.write_gpio(0x01, portValues[9], 0x23);
    mcp1.write_gpio(0x00, portValues[10], 0x22);
    mcp1.write_gpio(0x01, portValues[11], 0x22);

    USE_SERIAL.printf("Port A0: 0x%02X, Port B0: 0x%02X\n", portValues[0], portValues[1]);
    USE_SERIAL.printf("Port A1: 0x%02X, Port B1: 0x%02X\n", portValues[2], portValues[3]);
    USE_SERIAL.printf("Port A2: 0x%02X, Port B2: 0x%02X\n", portValues[4], portValues[5]);
    USE_SERIAL.printf("Port A3: 0x%02X, Port B3: 0x%02X\n", portValues[6], portValues[7]);
    USE_SERIAL.printf("Port A4: 0x%02X, Port B4: 0x%02X\n", portValues[8], portValues[9]);
    USE_SERIAL.printf("Port A5: 0x%02X, Port B5: 0x%02X\n", portValues[10], portValues[11]);
}

void setup() {
    USE_SERIAL.begin(9600);
    USE_SERIAL.flush();
    delay(100);
    USE_SERIAL.println("START");

    wifiMulti.addAP(SSID, PASS);
    initExpanders();
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
