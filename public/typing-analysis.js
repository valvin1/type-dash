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
        splitWords(text) {
            const normalized = typeof text === 'string' ? text.trim() : '';
            return normalized ? normalized.split(/\s+/) : [];
        },
        calculateProgress(completedWords, wordCount) {
            if (!Number.isFinite(completedWords) || !Number.isFinite(wordCount) || wordCount <= 0) return 0;
            return Math.min(100, Math.max(0, completedWords / wordCount * 100));
        },
        isEmptyWordSubmission(inputValue) {
            return typeof inputValue === 'string' && inputValue.endsWith(' ') && inputValue.trim() === '';
        },
        calculateWpm(correctWords, elapsedMs) {
            const elapsedMinutes = elapsedMs / 60000;
            return Math.round(correctWords / Math.max(elapsedMinutes, 0.01)) || 0;
        },
        shouldReportIncorrectSubmission(inputValue, targetWord) {
            return typeof inputValue === 'string'
                && inputValue.endsWith(' ')
                && !api.isEmptyWordSubmission(inputValue)
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
