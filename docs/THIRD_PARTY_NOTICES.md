# Third-party notices

This file identifies third-party material stored in or required by Smart City Hub. It is informational and does not replace the license text or terms supplied by each rights holder.

The repository's [MIT license](../LICENSE) applies only to project-authored code and documentation. It does not relicense the items listed below.

## Demo music

The audio track in `media/lego-city-demo.mp4` uses an excerpt from:

- **Title:** Soft Corporate
- **Author:** MusicLFiles
- **Source:** [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Soft_Corporate_by_MusicLFiles.ogg)
- **License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Changes:** shortened and mixed with the project demo video

No endorsement by the author is implied.

## Vendored MCP23017 firmware library

`source/embedded/esp32_arduino/mcp23017-arduino-1.0.4/` contains version 1.0.4 of the MCP23017 Arduino library attributed in its metadata to `bheesma-10`. The upstream repository currently resolves to [AvinasheeTech/mcp23017-arduino](https://github.com/AvinasheeTech/mcp23017-arduino).

No license declaration or LICENSE file was found in the vendored copy or the upstream repository during the review on 2026-07-14. Consequently, no permission to redistribute or relicense this library should be assumed. Its copyright remains with its author(s). Obtain permission or replace/remove the vendored copy before redistributing it.

## NXP reference documents

The following files are NXP Semiconductors documentation and are not covered by the project's MIT license:

- `Getting Started Guide for using MCUXpresso SDK online.pdf`
- `Getting Started with MCUXpresso SDK for LPCXpresso55S69.pdf`
- `Getting Started with MCUXpressoSDK and FreeRTOS OS.pdf`
- `MCUXpresso SDK API Reference Manual_LPC55S69.pdf`
- `MCUXpresso SDK ChangeLog_LPC55S69.pdf`
- `MCUXpresso SDK Release Notes for LPCXpresso55S69.pdf`
- `UM11158.pdf`

Copyright and usage terms are those stated by NXP in each document and on the applicable NXP download page. Terms for source-code excerpts may differ from the copyright terms for a document as a whole. Verify the applicable NXP terms before copying or redistributing these files.

## Course and project reference documents

The following PDFs carry no separate license declaration found during this review:

- `TWwAI - Projekt.pdf`
- `Technologie Webowe w Aplikacjach internetu II - aplikacja do obsługi inteligentnego miasteczka..pdf`
- `organizacja_zpsm_II.pdf`

Copyright remains with the authors or institution identified in each document. Do not assume that the repository's MIT license grants redistribution rights for these PDFs.

## Package-managed dependencies

The API, web, and mobile projects install direct and transitive dependencies from npm. Their exact resolved versions are recorded in the corresponding `package-lock.json` files, and each package remains under the license shipped in its package metadata and LICENSE/NOTICE files. `node_modules` is not stored in this repository, but compiled distributions may include parts of those packages and must preserve all applicable notices.

The ESP32 sketch also requires ArduinoJson 7.x, installed separately through the Arduino tooling and governed by the license of the installed package version.

This notice focuses on externally authored files and code shipped in, or explicitly required by, the repository. If a required attribution or license file is missing, please report it through the project's normal issue or security contact.
