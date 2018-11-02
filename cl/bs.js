const assert = require('assert');

const Game = require('./game').Game
const SyncPlayer = require('./player').SyncPlayer

const args = process.argv.slice(2);

const playingStrategies = {
    'AvoidLying': require('./playFunctions').AvoidLying,
    'Lie10Percent': require('./playFunctions').Lie10Percent,
    'Lie50Percent': require('./playFunctions').Lie50Percent,
    'AlwaysLie': require('./playFunctions').AlwaysLie,
    'AlwaysLieOnSingles': require('./playFunctions').AlwaysLieOnSingles,
    'ExpectedValueLiar': require('./playFunctions').ExpectedValueLiar,
    'Closer': require('./playFunctions').Closer,
    'RallyTime': require('./playFunctions').RallyTime,
    'LyingCloser': require('./playFunctions').LyingCloser
}

const callingStrategies = {
    'NeverCall': require('./callFunctions').NeverCall,
    'Call10Percent': require('./callFunctions').Call10Percent,
    'Call50Percent': require('./callFunctions').Call50Percent,
    'CallUpdatingPercentage': require('./callFunctions').CallUpdatingPercentage,
    'CallPercentageOnWinner': require('./callFunctions').CallPercentageOnWinner,
    'CallUnlikely': require('./callFunctions').CallUnlikely,
    'CallIfLieNeeded': require('./callFunctions').CallIfLieNeeded,
    'Collector': require('./callFunctions').Collector,
}

const playingStrategy = playingStrategies[args[0]]
const callingStrategy = callingStrategies[args[0]]

const otherPlayingStrategies = []
for (const strategy in playingStrategies) {
    if (strategy != args[0]) {
        otherPlayingStrategies.push(playingStrategies[strategy])
    }
}

const otherCallingStrategies = []
for (const strategy in callingStrategies) {
    if (strategy != args[0]) {
        otherCallingStrategies.push(callingStrategies[strategy])
    }
}

const createPlayer = () => {
    if (playingStrategy) {
        return playerWithRandomCallingStrategy(playingStrategy, otherCallingStrategies)
    } else if (callingStrategy) {
        return playerWithRandomPlayingStrategy(otherPlayingStrategies, callingStrategy)
    } else {
        assert('Strategy not found: ' + args[0])
    }
}

var playGamesAgainstRandomOpponents = function (total) {
    var promises = []
    for (var i = 0; i < total; i++) {
        const playerNumber = Math.floor(Math.random() * 4)
        const players = []
        for (var j = 0; j < 4; j++) {
            if (j === playerNumber) {
                players.push(createPlayer())
            } else {
                players.push(playerWithRandomStrategies(otherPlayingStrategies, otherCallingStrategies))
            }
        }

        const game = new Game(players)
        promises.push(game.playGame().then((result) => {
            if (result === playerNumber) {
                return 1
            } else if (result === -1) {
                return 0.25
            } else {
                return 0
            }
        }))
    }

    return Promise.all(promises).then((results) => {
        var count = 0
        for (var i = 0; i < results.length; ++i) {
            count += results[i]
        }

        return count
    })
}

var playGamesAgainstSpecificOpponent = function (total, opponent, playingStrategy) {
    var promises = []
    for (var i = 0; i < total; i++) {
        const playerNumber = Math.floor(Math.random() * 4)
        const players = []
        for (var j = 0; j < 4; j++) {
            if (j === playerNumber) {
                players.push(createPlayer())
            } else if (playingStrategy) {
                players.push(playerWithRandomCallingStrategy(opponent, otherCallingStrategies))
            } else {
                players.push(playerWithRandomPlayingStrategy(otherPlayingStrategies, opponent))
            }
        }

        const game = new Game(players)
        promises.push(game.playGame().then((result) => {
            if (result === playerNumber) {
                return 1
            } else if (result === -1) {
                return 0.25
            } else {
                return 0
            }
        }))
    }

    return Promise.all(promises).then((results) => {
        var count = 0
        for (var i = 0; i < results.length; ++i) {
            count += results[i]
        }

        return count
    })
}

var totalWins = 0
var promises = []
for (var i = 0; i < 50; i++) {
    promises.push(playGamesAgainstRandomOpponents(100).then((wins) => {
        totalWins += wins
    }))
}

const playAgainstRandomOpponents = sequential(promises).then(() => {
    console.log('Results: ' + totalWins + ' / 5000')
});

var otherGamePromises = []
for (var key in playingStrategies) {
    const saveKey = key
    if (key !== args[0]) {
        otherGamePromises.push(playGamesAgainstSpecificOpponent(100, playingStrategies[key], true).then((result) => {
            console.log('Against ' + saveKey + ': ' + result + ' / 100')
        }))
    }
}

for (var key in callingStrategies) {
    const saveKey = key
    if (key !== args[0]) {
        otherGamePromises.push(playGamesAgainstSpecificOpponent(100, callingStrategies[key], false).then((result) => {
            console.log('Against ' + saveKey + ': ' + result + ' / 100')
        }))
    }
}

const playAgainstSpecificOpponents = sequential(otherGamePromises)

playAgainstRandomOpponents.then(() => {
    return playAgainstSpecificOpponents
})

// Helper functions

function playerWithRandomStrategies(playing, calling) {
    const playingStrategy = randomArrayElement(playing)
    const callingStrategy = randomArrayElement(calling)

    return new SyncPlayer(new playingStrategy(), new callingStrategy())
}

function playerWithRandomCallingStrategy(playingStrategy, calling) {
    const callingStrategy = randomArrayElement(calling)

    return new SyncPlayer(new playingStrategy(), new callingStrategy())
}

function playerWithRandomPlayingStrategy(playing, callingStrategy) {
    const playingStrategy = randomArrayElement(playing)

    return new SyncPlayer(new playingStrategy(), new callingStrategy())
}

function randomArrayElement(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function sequential(promises) {
    return promises.reduce((chain, current) => {
        return chain.then(() => {
            return current
        })
    }, Promise.resolve())
}
