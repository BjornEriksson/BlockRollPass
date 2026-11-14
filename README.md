# BlockRollPass Captcha

A lightweight, dependency-free, physics-inspired HTML5 Canvas CAPTCHA where characters tumble like invisible blocks along a floor. Designed to deter standard OCR scrapers and single-frame image recognition.

## Live Demo

Test BlockRollPass directly in your browser: **[Live Demo on GitHub Pages](https://bjorneriksson.github.io/BlockRollPass/)**

## Features

* **Tumbling Block Physics:** Characters pivot 90 degrees at a time around their corners.
* **Configurable Flow:** Supports both right-to-left (`rtl`) and left-to-right (`ltr`) directions.
* **Pure HTML5 Canvas:** No DOM text nodes available for scraping.
* **Smart Decoys:** Mixes uppercase letters (`A–Z`) with ASCII symbols and geometric shapes without overlapping.
* **High Legibility:** Excludes easily confused characters (such as `I` and `O`).

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com
   ```
2. Open `index.html` in your browser, or include `style.css` and `blockrollpass.js` in your own project alongside the required HTML elements.

## Configuration

Pass an options object when initializing `new BlockRollPass('blockrollpass-canvas', { ... })` to customize parameters:

| Option | Default | Description |
| :--- | :--- | :--- |
| `letterCount` | `5` | Number of target uppercase letters to solve. |
| `direction` | `'rtl'` | Tumbling direction (`'rtl'` or `'ltr'`). |
| `tumbleSpeed` | `0.045` | Base step progress per frame (`0.01` – `0.1`). |
| `blockSize` | `44` | Size of the invisible rolling square block in pixels. |
| `floorY` | `82` | Vertical Y-position of the floor in pixels. |
| `decoyMode` | `'mixed'` | Decoy types: `'mixed'`, `'symbols'`, `'shapes'`, or `'none'`. |
| `decoyChance` | `0.35` | Probability (`0.0` – `1.0`) of inserting a decoy item. |

*(See `blockrollpass.js` for the complete list of styling and spacing options.)*

## Security Note

This library handles the client-side UI and physics engine. In a production environment, always pair it with server-side validation and session tokens.

## License

Open-source under the MIT License. Created by [BjornEriksson](https://github.com).
