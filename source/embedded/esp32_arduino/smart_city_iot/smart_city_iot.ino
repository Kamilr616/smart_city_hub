#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include "MCP23017.h"
#include <ArduinoJson.h>

#define I2C_SDA        21
#define I2C_SCL        22
#define USE_SERIAL Serial
#define SSID "C111"
#define PASS "wifi_pass"
#define URL "http://192.168.50.243:4200/api/state/iot/all"
#define TOKEN "Bearer secret_admin_token"

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
    if((wifiMulti.run() == WL_CONNECTED)) {

        HTTPClient http;
        http.begin(URL);       
        http.addHeader("x-access-token", TOKEN);       
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
                    return;
                }
                JsonArray array = doc.as<JsonArray>();
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
