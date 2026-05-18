# Security Audit Report

I have reviewed the codebase (specifically `server.js` and the Socket.IO interactions) and found several critical and high-severity security vulnerabilities. The application is highly susceptible to manipulation by malicious users, leading to server crashes, cheating, and game disruptions.

Here is a detailed breakdown of the vulnerabilities and how a user can trick the system, along with recommendations to fix them.

## 1. Denial of Service (DoS) via Unhandled Exceptions (Critical)
**Description:**
The server blindly trusts the format of incoming WebSocket payloads. A malicious user can send improperly formatted data (like `null` or objects instead of strings) to trigger unhandled exceptions, which will crash the entire Node.js server. 

**How a user tricks the system:**
- Sending `socket.emit('chooseTheme', { some: "object" })`: `path.join` expects a string, so passing an object throws a `TypeError`.
- Sending `socket.emit('updateProgress', null)`: Accessing `data.progress` on `null` throws a `TypeError`.

**Recommendation:**
Add strict type validation to all socket event handlers.
```javascript
socket.on('chooseTheme', (theme) => {
    if (typeof theme !== 'string') return; // Mitigation
    // ...
});

socket.on('updateProgress', (data) => {
    if (!data || typeof data !== 'object') return; // Mitigation
    // ...
});
```

## 2. Directory Traversal / Arbitrary File Read (High)
**Description:**
The `theme` parameter is used directly in a file path construction without sanitization.

**How a user tricks the system:**
A user can send a payload like `socket.emit('chooseTheme', '../../../etc')`. While the server filters for `.txt` files, it allows an attacker to probe the server's file system and read any `.txt` file outside of the `data/` directory.

**Recommendation:**
Sanitize the input by strictly ensuring the resolved path stays within the intended `DATA_DIR`.
```javascript
// In getRandomTextFromCategory
const safeCategory = path.basename(category); // Strips out ../
const categoryDir = path.join(DATA_DIR, safeCategory);

// Or enforce path boundary:
if (!categoryDir.startsWith(DATA_DIR)) return null;
```

## 3. Cheating via Unvalidated Progress Updates (High)
**Description:**
The server relies entirely on the client to report its own progress, WPM (Words Per Minute), and accuracy.

**How a user tricks the system:**
A player can write a simple script in their browser console to send fake progress data to the server, instantly winning the game:
```javascript
// Attacker runs this in the browser console
socket.emit('updateProgress', { progress: 100, wpm: 999, accuracy: 100, currentWordIndex: 999 });
```

**Recommendation:**
To fully prevent cheating, the server should track the game start time, receive the typed words from the client, and calculate the WPM and accuracy server-side. At a minimum, the server should validate that the progress is logically possible (e.g., WPM < 300) and that `updateProgress` is only accepted when `room.gameState === 'playing'`.

## 4. Game State Disruption (Medium)
**Description:**
Several socket events can be triggered at inappropriate times during the game lifecycle.

**How a user tricks the system:**
- **Rage quitting/Resetting:** If a player is losing, they can send `socket.emit('playAgain')` while the game is still running (`gameState === 'playing'`). This will instantly reset the game for both players without completing the current match.
- **Mid-game text swap:** The host (`P1`) can emit `chooseTheme` while the game is in progress, which replaces the text everyone is typing mid-match.

**Recommendation:**
Enforce state machine checks before allowing events:
```javascript
socket.on('playAgain', () => {
    const room = rooms[roomId];
    if (room && room.gameState === 'finished') { // Only allow if finished
        // ...
    }
});

socket.on('chooseTheme', (theme) => {
    const room = rooms[roomId];
    if (room && room.gameState === 'waiting') { // Only allow if waiting
        // ...
    }
});
```

## Summary
The current architecture follows a "Client is King" model, which is fundamentally insecure for multiplayer games. You should refactor the server to act as the authoritative source of truth, validating all incoming data types and restricting actions based on the current game state.
