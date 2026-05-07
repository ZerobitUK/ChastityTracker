# Timed Lock Assistant

A web-based utility designed to manage timed lock-box scenarios with integrated challenges and anti-cheat mechanisms. This application is designed to be hosted for free via GitHub Pages.

## Features
- **Dual-Timer System:** Tracks an initial random duration plus an accumulating penalty timer for failed challenges.
- **Anti-Cheat Logic:** Fetches the current time from a public API (`worldtimeapi.org`) to prevent system-clock manipulation.
- **Challenge Modules:** Includes Tic-Tac-Toe (with imperfect AI) and a "Guess the Number" logic game.
- **Master Recovery:** Generates a unique recovery key during setup to ensure the user is never permanently locked out due to data loss.
- **Persistence:** State is saved to `localStorage`, allowing the lock to survive page refreshes and browser restarts.

## Installation & Hosting
1. Create a new repository on GitHub.
2. Upload the project files maintaining the folder structure:
   - `index.html`
   - `css/style.css`
   - `js/` (containing all `.js` files)
   - `manifest.json`
3. Navigate to **Settings > Pages**.
4. Set the **Source** to the `main` branch and the `/root` folder.
5. Your app will be live at `https://[your-username].github.io/[repo-name]/`.

## Security Note
This is a client-side application. While it uses external time verification, it is intended for self-discipline and self-enforcement. The 4-digit PIN is stored in the browser's `localStorage` and is only revealed once the timer conditions are met.

**Warning:** Clearing your browser cache or site data will delete your active lock state. Always record your **Recovery Key** during setup.
