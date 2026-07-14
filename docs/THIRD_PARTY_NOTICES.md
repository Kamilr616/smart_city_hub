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

## Project reference document

The following PDF carries no separate license declaration found during this review:

- `Technologie Webowe w Aplikacjach internetu II - aplikacja do obsługi inteligentnego miasteczka..pdf`

Copyright remains with the authors or institution identified in the document. Do not assume that the repository's MIT license grants redistribution rights for this PDF.

## Package-managed dependencies

The API, web, and mobile projects install direct and transitive dependencies from npm. Their exact resolved versions are recorded in the corresponding `package-lock.json` files, and each package remains under the license shipped in its package metadata and LICENSE/NOTICE files. `node_modules` is not stored in this repository, but compiled distributions may include parts of those packages and must preserve all applicable notices.

The ESP32 sketch also requires ArduinoJson 7.x, installed separately through the Arduino tooling and governed by the license of the installed package version.

This notice focuses on externally authored files and code shipped in, or explicitly required by, the repository. If a required attribution or license file is missing, please report it through the project's normal issue or security contact.
