<div align="center">

<img src="public/icon-192.png" width="88" alt="AnimalPuzzle — the Prism Butterfly" />

<h1>AnimalPuzzle</h1>

**A tactical crystal puzzle. Unreasonably cute animals.**

Match forest friends, build cascades, and ignite prism reactions in a dark
Nordic crystal workshop. Every move can start a chain reaction — and every
cascade can become a small legend.

<br />

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&labelColor=0F1219&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&labelColor=0F1219&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&labelColor=0F1219&logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-34%20passing-10B981?style=flat-square&labelColor=0F1219)
![License](https://img.shields.io/badge/license-MIT-F5B841?style=flat-square&labelColor=0F1219)

</div>

<p align="center">
  <img src="docs/screenshots/menu.webp" alt="AnimalPuzzle main menu with campaign, daily challenge and animal skins" width="92%" />
</p>

## More than a match-3

AnimalPuzzle is a match-3 game where every gem is also a tiny creature. Swap
adjacent animals, build long chains, and use special pieces to break through
frost, chains and wooden crates.

The game is designed to be easy to pick up but hard to put down: short moves,
clear goals, and a reward loop that feels just as good on mobile as on desktop.
The in-game interface is currently in Swedish.

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🐾 Twelve animals, twelve colors</h3>
      <p>The fox, the panda, the dolphin and the rest have their own personalities — and their own little faces that make every match easy to read.</p>
    </td>
    <td width="50%" valign="top">
      <h3>✨ Cascades that keep building</h3>
      <p>Matches of four, L-shapes and T-shapes create Beams, Novas and Prisms. Combine them for Crossbeams, Supernovas and Prismstorms.</p>
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h3>🏆 Four chapters, 32 levels</h3>
      <p>From Skogsgläntan to Stjärnvalvet. Every level has its own objectives, star requirements and a clear difficulty curve.</p>
    </td>
    <td valign="top">
      <h3>📅 Something new every day</h3>
      <p>Daily challenges with a date-locked board, bonus energy and exclusive skins. Endless mode is there for anyone chasing one more record.</p>
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h3>🛠️ Tools with a purpose</h3>
      <p>Hammer, Cross Pulse and Shuffle charge through cascades. Use them when the board is stuck — not as a shortcut around the game.</p>
    </td>
    <td valign="top">
      <h3>📱 Play anywhere</h3>
      <p>Responsive layout, touch and mouse controls, fullscreen and PWA support with the Prism Butterfly on your home screen.</p>
    </td>
  </tr>
</table>

## From board to victory

<table>
  <tr>
    <td width="62%" align="center" valign="top">
      <img src="docs/screenshots/board.webp" alt="Game board with matching animals" width="100%" />
      <br />
      <sub><strong>Eight by eight</strong> · match, chain and read the board</sub>
    </td>
    <td width="38%" align="center" valign="top">
      <img src="docs/screenshots/victory.webp" alt="Victory screen with three stars" width="100%" />
      <br />
      <sub><strong>Three out of three</strong> · score, moves left and Harvest bonus</sub>
    </td>
  </tr>
</table>

## Game modes

| Mode | What awaits |
| :--- | :--- |
| **Campaign** | 32 handcrafted levels across four chapters. Complete the objectives before your moves run out and collect stars for better rewards. |
| **Daily Challenge** | A new, date-locked challenge every day. Complete it for bonus energy and a chance at exclusive animal skins. |
| **Endless** | No level objectives — just you, the board, and the hunt for your next personal best. |

## Getting started

**Requires:** [Bun](https://bun.sh) 1.x

```bash
git clone https://github.com/nRn-World/AnimalPuzzle.git
cd AnimalPuzzle
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). No API keys or external
services are required.

Build a production version:

```bash
bun run build
bun run preview
```

## How to play

1. **Swap two adjacent animals** to create a match.
2. **Match four or more** to create a Beam. L- and T-shapes create a Nova, and
   even larger combinations can create a Prism.
3. **Combine special pieces** for more powerful reactions — but keep an eye on
   the objectives. Frost, chains and wooden crates each need a different
   approach.
4. **Charge your tools** by chaining matches. Hammer breaks one tile, Cross
   Pulse clears a row and column, and Shuffle rearranges the board.

## Under the hood

| Part | Technology |
| :--- | :--- |
| Interface | React 19 + TypeScript |
| Build | Vite 8 + Tailwind CSS 4 |
| Game engine | Plain TypeScript in `src/game` |
| Effects | Canvas, Web Audio and Three.js |
| Quality | `bun test` + `tsc --noEmit` |
| Installation | PWA manifest with 192px and 512px icons |
| Language | Swedish in-game interface |

```text
src/
├─ components/     Board, HUD, modals and guides
├─ game/           Engine, levels, daily challenges and tests
├─ assets/         Backgrounds and artwork
└─ App.tsx         Game phases and state
public/
├─ manifest.webmanifest
├─ icon-192.png
├─ icon-512.png
└─ favicon.svg
docs/screenshots/  Images used by this README
```

## Quality

The project has **34 tests across 8 files**, covering the engine, levels,
daily records, achievements and tutorial limits.

```bash
bun test        # 34 tests
bun run lint    # TypeScript check
bun run build   # production build
```

## Install as an app

AnimalPuzzle can be added to your home screen. Open the game in a modern
browser and choose **Install** or **Add to Home Screen**. Android uses the
192px and 512px manifest icons; iOS uses the Apple touch icon.

## License

This project is licensed under the [MIT License](LICENSE).

© 2026 nRn-World
