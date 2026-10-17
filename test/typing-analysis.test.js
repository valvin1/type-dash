const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateWpm, calculateProgress, splitWords, isEmptyWordSubmission, createDeletionTracker, deletedCharacterCount, shouldReportIncorrectSubmission } = require('../public/typing-analysis');

test('progress uses normalized target words and cannot advance beyond the text', () => {
    const words = splitWords('  one\t two\nthree  ');
    assert.deepEqual(words, ['one', 'two', 'three']);
    assert.equal(calculateProgress(0, words.length), 0);
    assert.ok(Math.abs(calculateProgress(1, words.length) - 100 / 3) < Number.EPSILON * 100);
    assert.equal(calculateProgress(3, words.length), 100);
    assert.equal(calculateProgress(4, words.length), 100);
    assert.equal(calculateProgress(1, 0), 0);
    assert.equal(isEmptyWordSubmission(' '), true);
    assert.equal(isEmptyWordSubmission('word '), false);
});

test('WPM helper matches the live cumulative definition, including its minimum elapsed time', () => {
    assert.equal(calculateWpm(2, 1200), 100);
    assert.equal(calculateWpm(2, 100), 200);
    assert.equal(calculateWpm(0, 5000), 0);
});

test('typing UI reports a mismatch only when the word is submitted', () => {
    const target = 'correct';
    // The input can be temporarily wrong without ending in a submitted space.
    assert.equal(shouldReportIncorrectSubmission('corrext', target), false);
    assert.equal(shouldReportIncorrectSubmission('corrext ', target), true);
    // After backspace/correction, the actual submitted value is exact, so history of the typo is irrelevant.
    assert.equal(shouldReportIncorrectSubmission('correct ', target), false);
    assert.equal(shouldReportIncorrectSubmission(' ', target), false);
});

test('typing UI counts only actual Backspace and Delete character removals', () => {
    assert.equal(deletedCharacterCount('deleteContentBackward', 'word', 'wor'), 1);
    assert.equal(deletedCharacterCount('deleteContentForward', 'word', 'wrd'), 1);
    assert.equal(deletedCharacterCount('deleteWordBackward', 'some word', ''), 9);
    assert.equal(deletedCharacterCount('deleteContentBackward', '', ''), 0);
    assert.equal(deletedCharacterCount('deleteContentForward', 'word', 'word'), 0);
    assert.equal(deletedCharacterCount('insertText', 'wor', 'word'), 0);
    assert.equal(deletedCharacterCount('deleteByCut', 'word', 'wor'), 0);
    assert.equal(deletedCharacterCount('deleteContentBackward', '😀a', 'a'), 1);
});

test('empty inputType falls back to Backspace/Delete key intent only when characters were removed', () => {
    assert.equal(deletedCharacterCount('', 'word', 'wor', 'Backspace'), 1);
    assert.equal(deletedCharacterCount('', 'word', 'ord', 'Delete'), 1);
    assert.equal(deletedCharacterCount('', '', '', 'Backspace'), 0);
    assert.equal(deletedCharacterCount('', 'word', 'word', 'Delete'), 0);
    assert.equal(deletedCharacterCount('', 'wor', 'word', null), 0);
    assert.equal(deletedCharacterCount('insertText', 'word', 'wor', 'Backspace'), 0);
});

test('deletion key intent survives until the next input and is consumed exactly once', async () => {
    const tracker = createDeletionTracker();
    tracker.observeKey('Backspace', 'Lax');
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(tracker.observeInput('', 'Lax', 'La'), 1);
    assert.equal(tracker.observeInput('', 'La', 'L'), 0);

    tracker.observeKey('Delete', 'Lax');
    tracker.observeKey('x', 'Lax');
    assert.equal(tracker.observeInput('', 'Lax', 'La'), 0);

    tracker.observeKey('Backspace', 'word');
    assert.equal(tracker.observeInput('insertText', 'word', 'words'), 0);
});

test('correcting a partial typo records a deletion hesitation but no incorrect-word submission', () => {
    const target = 'correct';
    const beforeCorrection = 'corrext';
    const afterBackspace = 'correx';
    assert.equal(deletedCharacterCount('deleteContentBackward', beforeCorrection, afterBackspace), 1);
    assert.equal(shouldReportIncorrectSubmission(`${afterBackspace} `, target), true);
    assert.equal(shouldReportIncorrectSubmission(`${target} `, target), false);
});
