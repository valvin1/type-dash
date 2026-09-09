const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadDefaultUsernames, parseDefaultUsernames } = require('../server');

test('default username parser accepts BOM, line endings, comments, trimming, and inline hashes', () => {
    const warnings = [];
    const tenEmoji = '😀😀😀😀😀😀😀😀😀😀';
    const usernames = parseDefaultUsernames(Buffer.from(
        `\uFEFF  # comment\r\n  Dash  \r\n\r\n Dash\r\ndash\r\nABCDEFGHIJK\r\nTag#1\r\n${tenEmoji}\r\n`,
        'utf8'
    ), warning => warnings.push(warning));

    assert.deepEqual(usernames, ['Dash', 'dash', 'Tag#1', tenEmoji]);
    assert.ok(Object.isFrozen(usernames));
    assert.match(warnings[0], /ligne 4.*double/);
    assert.match(warnings[1], /ligne 6.*invalide/);
});

test('default username parser rejects malformed and effectively empty files', () => {
    assert.throws(
        () => parseDefaultUsernames(Buffer.from([0xc3, 0x28])),
        /data\/default-usernames\.txt.*UTF-8/i
    );
    assert.throws(
        () => parseDefaultUsernames(Buffer.from('# comment\n   \nABCDEFGHIJK\n'), () => {}),
        /data\/default-usernames\.txt.*aucun pseudo valide/i
    );
});

test('default username loader fails clearly when its startup file cannot be read', () => {
    assert.throws(
        () => loadDefaultUsernames(path.join(__dirname, 'missing-default-usernames.txt')),
        /Configuration de data\/default-usernames\.txt invalide.*lecture impossible/i
    );
    assert.throws(
        () => loadDefaultUsernames(path.join(__dirname, '..', 'data')),
        /Configuration de data\/default-usernames\.txt invalide.*lecture impossible/i
    );
});
