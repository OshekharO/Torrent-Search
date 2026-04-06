# Torrent Search

A fast, responsive, and elegant web app for searching torrents across multiple sources simultaneously. Enter any query and instantly browse combined results from **NyaaS** and **PirateBay**, complete with health indicators, file metadata, and one-click magnet actions.

## Features

- **Multi-source search** — queries NyaaS and PirateBay in parallel and merges results
- **Rich result cards** — displays name, file size, category, upload date, uploader, and seeder/leecher counts
- **Health indicator** — colour-coded dot (green / amber / grey) based on seeder count
- **One-click actions** per result:
  - Copy magnet link to clipboard
  - Open magnet URI directly in your torrent client
  - Visit the original torrent page
  - Download `.torrent` file *(NyaaS results only)*
  - Share magnet link via the Web Share API
- **Sorted by seeders** — healthiest torrents appear first
- **Dark / Light theme** — toggle persisted in `localStorage`, applied before first render to avoid flash
- **Fully responsive** — adaptive CSS Grid layout works on mobile, tablet, and desktop
- **URL-shareable searches** — query is reflected in the URL (`?query=…`) and restored on load

## Tech Stack

- [Bootstrap 5.3](https://getbootstrap.com/) — layout, utilities, and built-in dark-mode theming
- [Font Awesome 6](https://fontawesome.com/) — icons
- [Inter](https://fonts.google.com/specimen/Inter) — typeface
- [SweetAlert](https://sweetalert.js.org/) — user-friendly toast notifications
- Vanilla JS (ES2020+) — no jQuery

## APIs

| Source     | Endpoint |
|------------|----------|
| NyaaS      | `https://news-api-mocha.vercel.app/api/torrent/nyaasi/{query}` |
| PirateBay  | `https://news-api-mocha.vercel.app/api/torrent/piratebay/{query}` |

## Acknowledgements

- [AffanTheBest](https://github.com/AffanTheBest) — original base code
