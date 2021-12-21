const crypto = require("crypto");

const crashHash = "3aedc502b91fb39b96f6c0523a7dde397466c1769bf372756cddee259425aae5";
const rustHash = "97d2a569059bbcd8ead4444ff99071f4c01d005bcefe0d3567e1be628e5fdcd9";
// Hash from ethereum block #12936585. Public seed event: https://twitter.com/Roobet/status/1421635126602125313
const salt =
    "0xf22bacd2045342de47fcaf1532fcfe8d591fe5293b68e098d715c0daa1bd715e";

function saltHash(hash) {
    return crypto.createHmac("sha256", hash).update(salt).digest("hex");
}

function generateHash(seed) {
    return crypto.createHash("sha256").update(seed).digest("hex");
}

function divisible(hash, mod) {
    // We will read in 4 hex at a time, but the first chunk might be a bit smaller
    // So ABCDEFGHIJ should be chunked like  AB CDEF GHIJ
    var val = 0;

    var o = hash.length % 4;
    for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
        val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
    }

    return val === 0;
}

function crashPointFromHash(serverSeed) {
    const hash = crypto
        .createHmac("sha256", serverSeed)
        .update(salt)
        .digest("hex");

    console.log(hash)

    const hs = 100 / 5;
    if (divisible(hash, hs)) {
        return 1;
    }

    const h = parseInt(hash.slice(0, 52 / 4), 16);
    const e = Math.pow(2, 52);

    return Math.floor((100 * e - h) / (e - h)) / 100.0;
}

function getPreviousGames() {
    const previousGames = [];
    let gameHash = generateHash(crashHash);

    for (let i = 0; i < 100; i++) {
        const gameResult = crashPointFromHash(gameHash);
        previousGames.push({ gameHash, gameResult });
        gameHash = generateHash(gameHash);
    }

    return previousGames;
}

function verifyCrash() {
    const gameResult = crashPointFromHash(crashHash);
    const previousHundredGames = getPreviousGames();

    return { gameResult, previousHundredGames };
}

console.log(crashPointFromHash(rustHash));