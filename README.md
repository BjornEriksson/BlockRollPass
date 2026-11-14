# BlockRollPass Captcha

En lättlagd, beroendefri och fysikinspirerad HTML5 Canvas-captcha där tecken rullar fram som osynliga block längs ett golv. Utformad för att motverka standardiserade OCR-skrapare och enfrasbildigenkänning.

## Live-demo

Testa BlockRollPass direkt i webbläsaren: **[Live Demo på GitHub Pages](https://github.io)**

## Funktioner

* **Rullande block-fysik:** Tecken pivoterar 90 grader i taget kring sina hörn.
* **Konfigurerbart flöde:** Stöder både höger-till-vänster (`rtl`) och vänster-till-höger (`ltr`).
* **Ren HTML5 Canvas:** Inga DOM-textnoder som kan skrapas.
* **Smarta lockbeten:** Blandar versaler (`A–Z`) med ASCII-symboler och geometriska former utan överlappning.
* **Otvetydighet:** Utesluter lättförväxlade tecken (som `I` och `O`).

## Kom igång

1. Klona repot:
   ```bash
   git clone https://github.com
   ```
2. Inkludera `style.css` och `blockrollpass.js` i din HTML-sida tillsammans med canvas-elementet och initiera skriptet enligt dokumentationen i källkoden.

## Konfiguration

Skicka in ett inställnings-objekt vid initiering av `new BlockRollPass('blockrollpass-canvas', { ... })` för att justera parametrar som `letterCount`, `direction`, `tumbleSpeed`, `blockSize` och `floorY`. Fullständig parameterlista finns i originalfilen på GitHub.

## Säkerhetsnotering

Detta bibliotek hanterar klientsides-UI och fysikmotor. I produktion bör du alltid komplettera med validering på serversidan.

## Licens

Öppen källkod under MIT-licensen. Skapad av [BjornEriksson](https://github.com).
