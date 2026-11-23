const test = require('node:test');
const assert = require('node:assert/strict');
const SoloProgress = require('../public/solo-progress');

function createStorage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem(key) { return values.get(key) ?? null; },
        setItem(key, value) { values.set(key, value); },
        values
    };
}

function run({ score = 30, progress = 80, accuracy = 90, correctWords = 4, timeline } = {}) {
    return {
        wpm: score / (accuracy / 100), score, accuracy, progress, correctWords,
        timeline: timeline || [{ elapsedMs: 500, wpm: 20 }, { elapsedMs: 1000, wpm: 30 }]
    };
}

test('first completed qualified run stores best and shows current timeline without a comparator', () => {
    const storage = createStorage();
    const comparator = SoloProgress.beginRun('same text', storage);
    const result = SoloProgress.finishRun('same text', run(), comparator, storage);

    assert.equal(comparator, null);
    assert.equal(result.comparison, null);
    assert.equal(result.promoted, true);
    assert.equal(result.played, true);
    assert.deepEqual(result.current.timeline[0], { elapsedMs: 0, wpm: 0 });
    assert.equal(SoloProgress.getRecord('same text', storage).best.score, 30);
});

test('each replay compares to the best captured at its start, retaining it until beaten', () => {
    const storage = createStorage();
    SoloProgress.finishRun('same text', run({ score: 60 }), null, storage);

    const secondBest = SoloProgress.beginRun('same text', storage);
    const worse = SoloProgress.finishRun('same text', run({ score: 20 }), secondBest, storage);
    assert.equal(worse.comparison.score, 60);
    assert.equal(worse.promoted, false);

    const thirdBest = SoloProgress.beginRun('same text', storage);
    const improvedButStillWorse = SoloProgress.finishRun('same text', run({ score: 40 }), thirdBest, storage);
    assert.equal(improvedButStillWorse.comparison.score, 60);
    assert.equal(improvedButStillWorse.promoted, false);
    assert.equal(SoloProgress.getRecord('same text', storage).best.score, 60);

    const fourthBest = SoloProgress.beginRun('same text', storage);
    assert.equal(SoloProgress.finishRun('same text', run({ score: 70 }), fourthBest, storage).promoted, true);
    assert.equal(SoloProgress.beginRun('same text', storage).score, 70);
});

test('best ordering uses progress then accuracy ties and qualification requires three correct words', () => {
    const base = { score: 10, progress: 50, accuracy: 80 };
    assert.equal(SoloProgress.isBetterRun({ ...base, progress: 51, accuracy: 1 }, base), true);
    assert.equal(SoloProgress.isBetterRun({ ...base, accuracy: 81 }, base), true);
    assert.equal(SoloProgress.isBetterRun({ ...base, progress: 49, accuracy: 100 }, base), false);

    const storage = createStorage();
    SoloProgress.finishRun('other', run({ correctWords: 2 }), null, storage);
    assert.equal(SoloProgress.getRecord('other', storage).played, true);
    assert.equal(SoloProgress.getRecord('other', storage).best, null);
    assert.equal(SoloProgress.beginRun('unplayed other', storage), null);
});

test('zero-input completed run marks played, returns finite current stats, and creates no best', () => {
    const storage = createStorage();
    const result = SoloProgress.finishRun('zero input text', {
        id: 'player-zero', wpm: 0, accuracy: 0, progress: 0, correctWords: 0,
        timeline: [{ elapsedMs: 900, wpm: 0 }]
    }, null, storage);
    const record = SoloProgress.getRecord('zero input text', storage);

    assert.equal(result.played, true);
    assert.equal(result.qualified, false);
    assert.equal(result.promoted, false);
    assert.equal(result.comparison, null);
    assert.equal(record.played, true);
    assert.equal(record.best, null);
    for (const metric of [result.current.score, result.current.wpm, result.current.accuracy, result.current.progress]) {
        assert.equal(Number.isFinite(metric), true);
    }
    const chart = SoloProgress.buildChartSeries([{
        id: 'player-zero', wpm: result.current.wpm, accuracy: result.current.accuracy,
        progress: result.current.progress, timeline: []
    }], { playerId: 'player-zero', current: result.current });
    assert.equal(chart.length, 1);
    assert.equal(chart[0].wpm, 0);
    assert.deepEqual(chart[0].timeline[0], { elapsedMs: 0, wpm: 0 });
});

test('incomplete replay compares to and preserves an existing qualified best', () => {
    const storage = createStorage();
    SoloProgress.finishRun('incomplete after best', run({ score: 60 }), null, storage);
    const bestAtStart = SoloProgress.beginRun('incomplete after best', storage);
    const result = SoloProgress.finishRun('incomplete after best', run({ score: 100, correctWords: 2 }), bestAtStart, storage);

    assert.equal(result.qualified, false);
    assert.equal(result.comparison.score, 60);
    assert.equal(result.promoted, false);
    assert.equal(SoloProgress.getRecord('incomplete after best', storage).best.score, 60);
});

test('an exact score, progress, and accuracy tie does not replace the existing best', () => {
    const storage = createStorage();
    const winningRun = run({ score: 40, progress: 75, accuracy: 80, timeline: [{ elapsedMs: 1000, wpm: 50 }] });
    SoloProgress.finishRun('tie case', winningRun, null, storage);
    const comparator = SoloProgress.beginRun('tie case', storage);
    const tie = SoloProgress.finishRun('tie case', { ...winningRun, timeline: [{ elapsedMs: 1000, wpm: 45 }] }, comparator, storage);

    assert.equal(tie.promoted, false);
    assert.equal(tie.comparison.score, comparator.score);
    assert.deepEqual(SoloProgress.getRecord('tie case', storage).best.timeline, comparator.timeline);
});

test('current and historical chart series remain distinct and history is added only for an available comparator', () => {
    const storage = createStorage();
    const text = 'chart series isolation';
    const player = { id: 'player-chart', wpm: 30, accuracy: 90, progress: 50, correctWords: 4,
        timeline: [{ elapsedMs: 1000, wpm: 30 }] };
    const first = SoloProgress.finishRun(text, player, null, storage);
    const firstChart = SoloProgress.buildChartSeries([player], { playerId: player.id, current: first.current });
    assert.equal(firstChart.length, 1);
    assert.equal(firstChart[0].id, player.id);
    assert.deepEqual(firstChart[0].timeline[0], { elapsedMs: 0, wpm: 0 });

    const bestAtStart = SoloProgress.beginRun(text, storage);
    const replay = SoloProgress.finishRun(text, { ...player, timeline: [{ elapsedMs: 2000, wpm: 40 }] }, bestAtStart, storage);
    const replayChart = SoloProgress.buildChartSeries([player], {
        playerId: player.id, current: replay.current, comparison: replay.comparison
    });
    assert.equal(replayChart.length, 2);
    assert.equal(replayChart[0].isHistorical, undefined);
    assert.equal(replayChart[1].isHistorical, true);
    assert.deepEqual(replayChart[0].timeline, replay.current.timeline);
    assert.deepEqual(replayChart[1].timeline, bestAtStart.timeline);
    assert.notEqual(replayChart[0].timeline, replayChart[1].timeline);

    replayChart[0].timeline[1].wpm = 999;
    replayChart[1].timeline[1].wpm = 888;
    assert.equal(SoloProgress.getRecord(text, storage).best.timeline[1].wpm, 30);
    assert.equal(bestAtStart.timeline[1].wpm, 30);
});

test('Solo result panel is absent on first run and replay feedback uses the local best over stale server feedback', () => {
    const storage = createStorage();
    const text = 'ghost feedback source';
    const serverGhostResult = {
        outcome: 'new-best',
        differences: { score: 999, wpm: 999, accuracy: 999, progress: 999 }
    };

    const first = SoloProgress.finishRun(text, run({ score: 50 }), null, storage);
    assert.equal(SoloProgress.selectGhostFeedback('solo', first, serverGhostResult), null);

    const localBestAtStart = SoloProgress.beginRun(text, storage);
    const replay = SoloProgress.finishRun(text, run({ score: 45 }), localBestAtStart, storage);
    const feedback = SoloProgress.selectGhostFeedback('solo', replay, serverGhostResult);
    const refreshedRoomFeedback = SoloProgress.selectGhostFeedback('solo', replay, null);
    assert.equal(feedback.outcome, 'not-beaten');
    assert.equal(refreshedRoomFeedback.outcome, 'not-beaten');
    assert.equal(feedback.previousGhost.score, localBestAtStart.score);
    assert.equal(feedback.differences.score, replay.current.score - localBestAtStart.score);
    assert.equal(feedback.differences.wpm, replay.current.wpm - localBestAtStart.wpm);
    assert.notEqual(feedback.differences.score, serverGhostResult.differences.score);
});

test('non-Solo result feedback continues to use the server result', () => {
    const multiplayerFeedback = { outcome: 'not-beaten', differences: { score: -1 } };
    assert.equal(SoloProgress.selectGhostFeedback('multiplayer', null, multiplayerFeedback), multiplayerFeedback);
});

test('same exact text record survives a storage reload and other text remains separate', () => {
    const storage = createStorage();
    SoloProgress.finishRun('refresh case', run(), null, storage);
    const reloaded = createStorage({ [SoloProgress.STORAGE_KEY]: storage.values.get(SoloProgress.STORAGE_KEY) });
    SoloProgress.clearMemory();
    assert.equal(SoloProgress.beginRun('refresh case', reloaded).score, 30);
    assert.equal(SoloProgress.beginRun('refresh case ', reloaded), null);
});

test('malformed or unavailable storage falls back to memory and does not interrupt play', () => {
    const malformed = createStorage({ [SoloProgress.STORAGE_KEY]: '{bad json' });
    assert.doesNotThrow(() => SoloProgress.finishRun('memory text', run(), null, malformed));
    assert.equal(SoloProgress.beginRun('memory text', malformed).score, 30);

    const unavailable = { getItem() { throw new Error('disabled'); }, setItem() { throw new Error('disabled'); } };
    assert.doesNotThrow(() => SoloProgress.finishRun('unavailable', run(), null, unavailable));
    assert.equal(SoloProgress.beginRun('unavailable', unavailable).score, 30);
});
