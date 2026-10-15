(function exposeTypingAnalysis(root, factory) {
    const api = factory();
    root.TypingAnalysis = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis, () => {
    const deletionInputTypes = new Set([
        'deleteContentBackward',
        'deleteContentForward',
        'deleteWordBackward',
        'deleteWordForward'
    ]);
    const api = {
        calculateWpm(correctWords, elapsedMs) {
            const elapsedMinutes = elapsedMs / 60000;
            return Math.round(correctWords / Math.max(elapsedMinutes, 0.01)) || 0;
        },
        shouldReportIncorrectSubmission(inputValue, targetWord) {
            return typeof inputValue === 'string'
                && inputValue.endsWith(' ')
                && inputValue.trim() !== targetWord;
        },
        deletedCharacterCount(inputType, previousValue, nextValue, keyIntent = null) {
            const hasDeleteIntent = deletionInputTypes.has(inputType)
                || (!inputType && (keyIntent === 'Backspace' || keyIntent === 'Delete'));
            if (!hasDeleteIntent) return 0;
            const removed = Array.from(previousValue).length - Array.from(nextValue).length;
            return removed > 0 ? removed : 0;
        },
        createDeletionTracker() {
            let pending = null;
            return {
                observeKey(key, value) {
                    pending = key === 'Backspace' || key === 'Delete' ? { key, value } : null;
                },
                observeInput(inputType, previousValue, nextValue) {
                    const intent = pending;
                    pending = null;
                    const keyIntent = !inputType && intent?.value === previousValue ? intent.key : null;
                    return api.deletedCharacterCount(inputType, previousValue, nextValue, keyIntent);
                },
                reset() {
                    pending = null;
                }
            };
        }
    };
    return api;
});
