const test = require('node:test');
const assert = require('node:assert/strict');
const { limitUsernameToCodePoints, setPlayerName } = require('../public/player-display');

test('browser name editor limit keeps ten astral Unicode characters', () => {
    const tenEmoji = '😀😀😀😀😀😀😀😀😀😀';
    assert.equal(limitUsernameToCodePoints(tenEmoji), tenEmoji);
    assert.equal(limitUsernameToCodePoints(`${tenEmoji}😀`), tenEmoji);
    assert.equal(limitUsernameToCodePoints('Léa'), 'Léa');
});

test('client player-name renderer inserts markup-like names as text in every view', () => {
    const markupLikeName = '<Max>';
    const views = ['lobby', 'racetrack', 'podium', 'standings'].map(() => ({
        set innerHTML(_value) {
            throw new Error('Player names must not be inserted as HTML');
        },
        set textContent(value) {
            this.renderedText = value;
        }
    }));

    views.forEach(view => setPlayerName(view, markupLikeName));
    views.forEach(view => assert.equal(view.renderedText, markupLikeName));
});
