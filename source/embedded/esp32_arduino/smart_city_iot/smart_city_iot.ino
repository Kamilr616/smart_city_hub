#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define I2C_SDA        21
#define I2C_SCL        22
#define USE_SERIAL Serial
#define SSID "C111"
#define PASS "abcdefabcdef987654321"
#define URL "http://192.168.50.243:4200/api/state/iot/all"
#define TOKEN "Bearer "

uint8_t adresses_len = 5;
uint8_t addresses[adresses_len+1] = {0x27, 0x26, 0x25, 0x24, 0x23, 0x22};


void initWire(sda, scl){
    Wire.begin(sda, scl);     
    Wire.setClock(100000);  //100kHz
}

void iodir(uint8_t port, uint8_t iodir, uint8_t address)
{
  Wire.beginTransmission(address);
  Wire.write(REGISTER_IODIRA | port);  
  Wire.write(iodir);                   
  Wire.endTransmission();
}

void write_gpio(uint8_t port, uint32_t data, uint8_t address)
{
  Wire.beginTransmission(address);
  Wire.write(REGISTER_GPIOA | port);
  Wire.write(data);
  Wire.endTransmission();
}

void initExpanders() {
    for (uint8_t i = 0; i < 5); i++) {
        uint8_t address = addresses[i];
        iodir(0x00, 0x00, address);
        iodir(0x01, 0x00, address);
        write_gpio(0x00, 0x00, address);
        write_gpio(0x01, 0x00, address);
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

    for (uint8_t i = 0; i < adresses_len; i++)
    {
        mcp1.write_gpio(0x00, portValues[2*i], addresses[i]);
        mcp1.write_gpio(0x01, portValues[2*i + 1], addresses[i]);
    }

    for (uint8_t i = 0; i < adresses_len; i++)
    {
        USE_SERIAL.printf("Port A%u: 0x%02X, Port B%u: 0x%02X\n", i, portValues[2*i], i, portValues[2*i + 1]);
    }
}

void setup() {
    USE_SERIAL.begin(9600);
    USE_SERIAL.flush();
    delay(100);
    USE_SERIAL.println("START");

    WiFi.begin(SSID, PASS);
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
