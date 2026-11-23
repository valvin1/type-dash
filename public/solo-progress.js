(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.SoloProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const STORAGE_KEY = 'type-dash.solo-progress.v1';
    const MIN_CORRECT_WORDS = 3;
    const memory = new Map();

    function isFiniteNumber(value) { return Number.isFinite(value) && value >= 0; }

    function validTimeline(timeline) {
        return Array.isArray(timeline) && timeline.every((point, index) =>
            point && isFiniteNumber(point.elapsedMs) && isFiniteNumber(point.wpm) &&
            (index === 0 || point.elapsedMs >= timeline[index - 1].elapsedMs));
    }

    function validBest(best) {
        return best === null || (best && isFiniteNumber(best.score) && isFiniteNumber(best.wpm) &&
            isFiniteNumber(best.accuracy) && best.accuracy <= 100 && isFiniteNumber(best.progress) &&
            best.progress <= 100 && Number.isInteger(best.correctWords) && best.correctWords >= MIN_CORRECT_WORDS &&
            validTimeline(best.timeline));
    }

    function normalizeRecord(record) {
        if (!record || typeof record.played !== 'boolean' || !validBest(record.best)) return null;
        return { played: record.played, best: record.best ? structuredClone(record.best) : null };
    }

    function readAll(storage) {
        try {
            const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch { return {}; }
    }

    function getRecord(text, storage) {
        const fromMemory = memory.get(text);
        if (fromMemory) return normalizeRecord(fromMemory);
        try {
            const record = normalizeRecord(readAll(storage)[text]);
            if (record) memory.set(text, record);
            return record || { played: false, best: null };
        } catch { return { played: false, best: null }; }
    }

    function score(run) { return Math.round(run.wpm * run.accuracy / 100); }

    function isBetterRun(candidate, incumbent) {
        if (!incumbent) return true;
        if (candidate.score !== incumbent.score) return candidate.score > incumbent.score;
        if (candidate.progress !== incumbent.progress) return candidate.progress > incumbent.progress;
        return candidate.accuracy > incumbent.accuracy;
    }

    function createRunSnapshot(player) {
        const timeline = validTimeline(player?.timeline) ? player.timeline.map(point => ({ ...point })) : [];
        if (!timeline.length || timeline[0].elapsedMs !== 0) timeline.unshift({ elapsedMs: 0, wpm: 0 });
        else timeline[0] = { elapsedMs: 0, wpm: 0 };
        return {
            score: score(player), wpm: Number(player.wpm) || 0, accuracy: Number(player.accuracy) || 0,
            progress: Number(player.progress) || 0, correctWords: Number(player.correctWords) || 0, timeline
        };
    }

    function buildChartSeries(players, { playerId, current, comparison } = {}) {
        const series = (players || []).map(player => ({
            ...player,
            timeline: player.id === playerId && current
                ? current.timeline.map(point => ({ ...point }))
                : Array.isArray(player.timeline) ? player.timeline.map(point => ({ ...point })) : player.timeline
        }));
        if (comparison) {
            series.push({
                role: 'Meilleur run précédent', username: 'Meilleur run précédent', isHistorical: true,
                timeline: comparison.timeline.map(point => ({ ...point }))
            });
        }
        return series;
    }

    function buildGhostFeedback(current, previousBest) {
        if (!current || !previousBest) return null;
        return {
            outcome: isBetterRun(current, previousBest) ? 'new-best' : 'not-beaten',
            current: {
                score: current.score, wpm: current.wpm, accuracy: current.accuracy,
                progress: current.progress, correctWords: current.correctWords
            },
            previousGhost: previousBest,
            differences: {
                score: current.score - previousBest.score,
                wpm: current.wpm - previousBest.wpm,
                accuracy: current.accuracy - previousBest.accuracy,
                progress: current.progress - previousBest.progress
            }
        };
    }

    function selectGhostFeedback(mode, soloResult, serverGhostResult) {
        if (mode !== 'solo') return serverGhostResult || null;
        return soloResult?.comparison
            ? buildGhostFeedback(soloResult.current, soloResult.comparison)
            : null;
    }

    function persist(text, record, storage) {
        memory.set(text, record);
        try {
            const all = readAll(storage);
            all[text] = record;
            storage.setItem(STORAGE_KEY, JSON.stringify(all));
        } catch { /* The session memory remains usable if browser storage is unavailable. */ }
    }

    function beginRun(text, storage) {
        const record = getRecord(text, storage);
        return record.best ? structuredClone(record.best) : null;
    }

    function finishRun(text, player, comparator, storage) {
        const current = createRunSnapshot(player);
        const record = getRecord(text, storage);
        const best = record.best;
        const comparison = comparator ? structuredClone(comparator) : null;
        const qualified = current.correctWords >= MIN_CORRECT_WORDS;
        const promoted = qualified && isBetterRun(current, best);
        const next = { played: true, best: promoted ? current : best };
        persist(text, next, storage);
        return { current, comparison, promoted, qualified, played: true };
    }

    function clearMemory() { memory.clear(); }

    return {
        STORAGE_KEY, MIN_CORRECT_WORDS, isBetterRun, beginRun, finishRun, getRecord,
        createRunSnapshot, buildChartSeries, buildGhostFeedback, selectGhostFeedback, clearMemory
    };
});
