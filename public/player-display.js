(function exposePlayerDisplay(root, factory) {
    const playerDisplay = factory();
    if (typeof module === 'object' && module.exports) module.exports = playerDisplay;
    root.playerDisplay = playerDisplay;
}(typeof window !== 'undefined' ? window : globalThis, () => ({
    limitUsernameToCodePoints(username, maximumLength = 10) {
        return Array.from(username).slice(0, maximumLength).join('');
    },

    setPlayerName(element, username) {
        element.textContent = username;
    }
})));
