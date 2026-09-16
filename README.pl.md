# 🏙️ Smart City Hub

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-API-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-dashboard-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-mobile-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/)
[![Licencja: MIT](https://img.shields.io/badge/Licencja-MIT-yellow.svg)](LICENSE)

> 🇬🇧 [English version](README.md)

Smart City Hub to zintegrowany system do zarządzania i monitorowania infrastruktury miejskiej. Łączy urządzenia IoT oparte na ESP32, centralne API w Node.js/TypeScript, panel webowy w React oraz aplikację mobilną React Native.

Panel webowy i firmware ESP32 korzystają ze wspólnego API Node.js/MongoDB. Aplikacja React Native miała być kolejnym klientem tego systemu, ale integracja nie została ukończona; zachowany prototyp mobilny niezależnie korzysta z Firebase Auth i Firestore.

Trzeci, wyłącznie do odczytu, klient — aplikacja webowa [Cyfrowy bliźniak](https://github.com/Kamilr616/smart-city-digital-twin) — odzwierciedla na ekranie fizyczną makietę LEGO, odpytując z tokenem JWT ten sam endpoint stanów urządzeń co firmware ESP32. Znajduje się we własnym repozytorium.

📄 Szczegółowy opis architektury i API znajduje się w [dokumentacji technicznej](docs/DOCUMENTATION.pl.md) ([English version](docs/DOCUMENTATION.md)).

**🗓️ Okres realizacji:** 2024

## 🎥 Demo — inteligentne miasto z LEGO

System został zbudowany i zademonstrowany na **fizycznej makiecie miasta z LEGO** w kole naukowym KI AT: moduły ESP32 pobierały z API zadane stany i sterowały światłami oraz urządzeniami makiety.

<p align="center">
  <img src="docs/media/lego-city-day.jpg" alt="Makieta inteligentnego miasta z LEGO w dzień" width="49%"/>
  <img src="docs/media/lego-city-connected.jpg" alt="Prototyp oświetlenia ESP32 podłączony do makiety LEGO" width="49%"/>
</p>

<p align="center">
  <img src="docs/media/lego-city.jpg" alt="Podświetlona makieta inteligentnego miasta z LEGO" width="72%"/>
</p>

🎬 [Obejrzyj połączone demo oświetlenia LEGO](docs/media/lego-city-demo.mp4) *(33 s, z muzyką)*

Muzyka: „Soft Corporate” — MusicLFiles (CC BY 4.0). Zobacz [informacje o licencjach podmiotów trzecich](docs/THIRD_PARTY_NOTICES.md).

## Zrzuty ekranu

Klient webowy React rozpoczyna pracę od ekranu logowania JWT, a następnie otwiera panel użytkownika lub administratora:

<p align="center">
  <img src="docs/media/web-login.png" alt="Logowanie webowe Smart City Hub" width="49%"/>
  <img src="docs/media/web-admin-dashboard.png" alt="Panel urządzeń administratora Smart City Hub" width="49%"/>
</p>

Zrzut panelu wyrenderowano z bieżącego klienta przy użyciu reprezentatywnych lokalnych danych urządzeń.

## Architektura

```mermaid
flowchart LR
    WEB["Panel webowy React<br/>admin / user"] <-->|"REST + JWT"| API["API Express<br/>TypeScript"]
    ESP["ESP32 + 6x MCP23017<br/>96 wyjść"] <-->|"odpytywanie HTTP"| API
    API <-->|"Mongoose"| DB[("MongoDB")]
    MOBILE["Aplikacja React Native"] <-->|"Firebase SDK"| FIREBASE[("Auth + Firestore")]
    Twin["Cyfrowy bliźniak (web)"] -->|"odpytuje stany z JWT"| API
```

## Struktura repozytorium

```
smart_city_hub/
├── source/
│   ├── server/api/            # REST API (Node.js, Express, TypeScript, Mongoose)
│   ├── web/react/             # Panel webowy (React 18, Vite, Tailwind CSS)
│   ├── mobile/react-native/   # Aplikacja mobilna (React Native + Firebase)
│   └── embedded/esp32_arduino/ # Firmware ESP32 (Arduino, MCP23017)
├── docs/                      # Dokumentacja, materiały sprzętowe i multimedia
├── LICENSE                    # MIT
└── README.md
```

## Funkcje

- **Urządzenia i lokalizacje** — widok `Devices` zależny od roli zastępuje dawny ekran `Home Lights`; `Locations` powstaje z urządzeń i czujników dostępnych dla zalogowanego konta.
- **Sterowanie i historia urządzeń** — do 96 wyjść cyfrowych (6 ekspanderów MCP23017 × 16 pinów) można sterować zdalnie, a wykres każdego urządzenia korzysta z zapisów `DeviceState.states`.
- **Odczyty i wykresy czujników** — temperatura, wilgotność i ciśnienie są prezentowane dla 1 godziny, 24 godzin, 7 dni lub 30 dni.
- **Role i uwierzytelnianie** — logowanie JWT z osobnymi rolami `admin` / `user`; admin zarządza użytkownikami i urządzeniami, użytkownik steruje przypisanymi urządzeniami.

## Wymagania

- Node.js 18+ i npm
- Konto MongoDB Atlas (lub lokalna instancja MongoDB)
- Do firmware: Arduino IDE ze wsparciem płytek ESP32 oraz `ArduinoJson` 7.x; rejestry MCP23017 są obsługiwane bezpośrednio przez I2C
- Do zachowanej aplikacji mobilnej: macOS z Xcode, środowisko React Native i projekt Firebase

## Szybki start

### 1. API (backend)

```bash
cd source/server/api
npm ci
```

Skopiuj `.env.example` do `.env`, a następnie zastąp wartości przykładowe:

```env
PORT=4200
JWT_SECRET_KEY=<losowy_sekret>
MONGODB_URI=mongodb+srv://<user>:<haslo>@<cluster>.mongodb.net/<baza>
CORS_ORIGIN=http://localhost:5173  # lista dozwolonych źródeł web, rozdzielona przecinkami
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_NAME=admin
INITIAL_ADMIN_PASSWORD=<co_najmniej_12_znakow>
```

W przypadku nowej bazy jednorazowo utwórz pierwszego administratora:

```bash
npm run seed:admin
```

Polecenie jest idempotentne dla istniejącego, kompletnego administratora i odmawia nadpisania użytkownika powodującego konflikt. Po utworzeniu konta usuń `INITIAL_ADMIN_PASSWORD` z pliku `.env`.

Uruchom API:

```bash
npm run dev     # tryb deweloperski (ts-node)
npm run watch   # tryb deweloperski z auto-restartem (nodemon)
npm run build   # kompilacja TypeScript do dist/
npm test        # build i testy regresji API, serverless oraz uwierzytelniania
```

API domyślnie nasłuchuje na `http://localhost:4200`.

#### Wdrożenie API na Vercelu

Utwórz projekt Vercel z następującymi ustawieniami backendu:

| Ustawienie | Wartość |
|---|---|
| Root Directory | `source/server/api` |
| Framework Preset | Other |
| Install Command | `npm ci` |
| Build Command | `npm run typecheck && npm run build` |
| Output Directory | `dist/public` |

Statyczny output obsługuje `/` niezależnie od MongoDB. Vercel buduje handler serverless z `api/index.ts`, a `vercel.json` przepisuje `/api/:path*` na `/api`; nie ustawiaj `dist` jako Root Directory.

Ustaw `JWT_SECRET_KEY`, `MONGODB_URI` i `CORS_ORIGIN` dla Preview oraz Production. `PORT` służy wyłącznie lokalnie. W MongoDB Atlas zezwól na dostęp sieciowy dla faktycznego egressu wdrożenia Vercel; szeroka reguła `0.0.0.0/0` nie jest z założenia wymagana.

Przed promocją uruchom `npm test` w `source/server/api`. Polecenia `vercel link`, `vercel pull --yes --environment=preview` i `vercel build --local-config source/server/api/vercel.json` uruchom z katalogu głównego repozytorium, wybierając projekt API. CLI sam uwzględnia Root Directory projektu (`source/server/api`); uruchomienie go wewnątrz tego katalogu powoduje podwojenie ścieżki. Potwierdź, że `.vercel/output/functions` zawiera funkcję API, a `.vercel/output/config.json` trasuje `/api/*`, po czym wykonaj testy dymne Preview:

- `GET /` zwraca statyczny HTML ze statusem 200, również gdy baza jest niedostępna.
- `GET /api/state/iot/all` bez tokenu zwraca aplikacyjne 401, gdy baza jest dostępna.

404 platformy oznacza problem z wykryciem funkcji lub routingiem. Aplikacyjne 404 dla nieznanej trasy API albo 401 z chronionej trasy potwierdza obsługę żądania przez Express. Ogólna odpowiedź JSON 503 z błędem `Database unavailable` oznacza, że funkcja została wykonana, ale nie połączyła się z MongoDB. Artefakty builda i testy dymne Preview są wymaganym sprawdzeniem wdrożenia.

### 2. Panel webowy

```bash
cd source/web/react
npm ci
```

Skopiuj `.env.example` do `.env` i zmień go, jeśli API działa pod innym adresem:

```env
VITE_API_URL=http://localhost:4200/api
```

`VITE_API_URL` może zawierać końcowe `/api` albo je pomijać; klient normalizuje oba warianty do jednego prefiksu API.

Uruchom:

```bash
npm run dev      # serwer deweloperski Vite
npm run build    # build produkcyjny do dist/
npm run preview  # podgląd builda produkcyjnego
npm test         # testy jednostkowe frontendu
npm run test:e2e # testy panelu Playwright z mockowanym API
```

Serwer deweloperski Vite jest domyślnie dostępny pod adresem `http://localhost:5173`.

Panel odświeża dane na żywo co 30 sekund. Wykresy czujników domyślnie korzystają z prawdziwych odczytów API; opcjonalny przełącznik DEMO jest początkowo wyłączony i generuje próbki wyłącznie w przeglądarce, bez zapisów do API. Bez podłączonego ESP zarejestrowane czujniki nie mają prawdziwych pomiarów do pokazania. Historia urządzenia zachowuje stan nieznany przed pierwszą obserwacją i pozostawia pusty pominięty okres, gdy API oznaczy wynik jako skrócony. Zestaw Playwright mockuje odpowiedzi API i nie zapisuje danych w prawdziwym backendzie.

### 3. Firmware ESP32

1. Otwórz `source/embedded/esp32_arduino/smart_city_iot/smart_city_iot.ino` w Arduino IDE.
2. Skopiuj `secrets.example.h` do ignorowanego przez Git pliku `secrets.h` w tym samym katalogu.
3. Ustaw dane WiFi, URL API oraz prawidłowy token bearer wygenerowany przez API.
4. Skompiluj i wgraj na płytkę ESP32 (magistrala I2C: SDA=21, SCL=22, serial 9600 baud).

### 4. Aplikacja mobilna (opcjonalnie)

Integracja ze wspólnym API Node.js była planowana, ale nie została ukończona. Zachowany prototyp mobilny korzysta więc z własnego backendu **Firebase** (Auth + Firestore).

Zachowano wyłącznie natywny projekt iOS. Jego zbudowanie wymaga macOS z Xcode; repozytorium nie zawiera natywnego projektu Android.

```bash
cd source/mobile/react-native
npm ci
npm start        # bundler Metro
npm run ios
```

`npm ci` tworzy ignorowany `firebaseConfig.local.ts` z szablonu, jeżeli pliku brakuje. Przed uruchomieniem uzupełnij lokalny plik konfiguracją swojego projektu Firebase.

## Stos technologiczny

| Warstwa | Technologie |
|---|---|
| Backend | Node.js, Express 4, TypeScript, Mongoose 8, JWT, bcrypt, Joi |
| Baza danych | MongoDB (Atlas) |
| Web | React 18, Vite, React Router 6, Chart.js, axios, Tailwind CSS, Playwright |
| Mobile | React Native 0.73, React Navigation, Firebase (Auth, Firestore) |
| Embedded | ESP32 (Arduino), MCP23017, ArduinoJson, WiFi + HTTPClient |

## 👥 Zespół

| Osoba | Rola |
|-------|------|
| **Kamil Rataj** ([@Kamilr616](https://github.com/Kamilr616), [LinkedIn](https://www.linkedin.com/in/kamil-r-153ab7121/)) | Autor i opiekun |
| **Mateusz Ciszek** ([@Matix351](https://github.com/Matix351)) | Współautor |
| **Marcin Golonka** ([@Golonka-Ma](https://github.com/Golonka-Ma), [LinkedIn](https://www.linkedin.com/in/marcin-golonka-4510a928b/)) | Autor prototypu React Native |

## Bezpieczeństwo

Wartości JWT, MongoDB, Firebase i Wi-Fi przechowuj w opisanych wyżej plikach lokalnych; commituj wyłącznie dostarczone szablony. Podatności zgłaszaj zgodnie z [SECURITY.md](SECURITY.md), a nie w publicznym issue.

## Licencja

Kod i dokumentacja autorstwa zespołu projektu są udostępnione na licencji [MIT](LICENSE). Dołączone i wskazane materiały podmiotów trzecich pozostają na właściwych im warunkach; zobacz [informacje o licencjach podmiotów trzecich](docs/THIRD_PARTY_NOTICES.md).

## Katalog czujników LEGO

Dwa planowane czujniki środowiskowe opisano w
[lego-sensors.json](source/server/api/scripts/lego-sensors.json): stacja pogodowa przy
ulicy (ID czujnika 0) i czujnik przy Corner Garage (ID 1).
API udostępnia nazwy, opisy, lokalizację i jednostki przez
`GET /api/sensor/catalog`. Administrator rejestruje lub aktualizuje definicję przez
`POST /api/sensor/catalog`, podając `deviceId`, `name`, `description` i `location`.

Definicje mają osobną kolekcję, niezależną od odczytów i urządzeń wykonawczych.
Rejestracja nie tworzy pomiarów: bez danych z ESP endpoint najnowszych odczytów nadal
zwraca puste miejsca czujników. Symulacja Digital Twin działa w przeglądarce.
Chroniona trasa zbiorczego zapisu pomiarów przyjmuje ID czujników 0 i 1.
