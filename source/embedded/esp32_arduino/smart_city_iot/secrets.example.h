#ifndef SMART_CITY_SECRETS_H
#define SMART_CITY_SECRETS_H

// Copy this file to secrets.h and provide values for your environment.
#define WIFI_SSID "replace-with-wifi-ssid"
#define WIFI_PASSWORD "replace-with-wifi-password"
#define API_URL "http://192.0.2.1:4200/api/state/iot/all"
// Create a location-scoped token in the administrator Tokeny ESP view (1-365 days).
// Copy the complete sch_... value shown once; the sketch sends this via x-access-token.
// Utworz token lokalizacji w panelu Tokeny ESP i skopiuj cala wartosc sch_... pokazywana raz.
// Keep the Bearer prefix. Never commit secrets.h. Expiry/revocation requires a new token.
#define API_TOKEN "Bearer sch_replace-with-the-complete-generated-token"

#endif
