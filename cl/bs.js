const assert = require('assert');

const Game = require('./game').Game
const SyncPlayer = require('./player').SyncPlayer

const args = process.argv.slice(2);

// Bad strategies have been commented out
const playingStrategies = {
    'AvoidLying': require('./playFunctions').AvoidLying,
    'Lie10Percent': require('./playFunctions').Lie10Percent,
    // 'Lie50Percent': require('./playFunctions').Lie50Percent,
    // 'AlwaysLie': require('./playFunctions').AlwaysLie,
    'AlwaysLieOnSingles': require('./playFunctions').AlwaysLieOnSingles,
    'ExpectedValueLiar': require('./playFunctions').ExpectedValueLiar,
    // 'Closer': require('./playFunctions').Closer,
    'RallyTime': require('./playFunctions').RallyTime,
    // 'LyingCloser': require('./playFunctions').LyingCloser,
    'RallyCloser': require('./playFunctions').RallyCloser,
}

const orderedPlayingStrategies = [
    'AvoidLying',
    'Lie10Percent',
    // 'Lie50Percent',
    // 'AlwaysLie',
    'AlwaysLieOnSingles',
    'ExpectedValueLiar',
    // 'Closer',
    'RallyTime',
    // 'LyingCloser',
    'RallyCloser'
]

const callingStrategies = {
    'NeverCall': require('./callFunctions').NeverCall,
    'Call10Percent': require('./callFunctions').Call10Percent,
    // 'Call50Percent': require('./callFunctions').Call50Percent,
    'CallUpdatingPercentage': require('./callFunctions').CallUpdatingPercentage,
    'CallPercentageOnWinner': require('./callFunctions').CallPercentageOnWinner,
    'CallUnlikely': require('./callFunctions').CallUnlikely,
    'CallIfLieNeeded': require('./callFunctions').CallIfLieNeeded,
    // 'Collector': require('./callFunctions').Collector,
}

const orderedCallingStrategies = [
    'NeverCall',
    'Call10Percent',
    // 'Call50Percent',
    'CallUpdatingPercentage',
    'CallPercentageOnWinner',
    'CallUnlikely',
    'CallIfLieNeeded',
    // 'Collector',
]

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

var playGamesAgainstRandomOpponents = function(total) {
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
    promises.push(
        () => {
            return playGamesAgainstRandomOpponents(100).then((wins) => {
                totalWins += wins
            })
        }
    )
}

var otherGamePromises = []
for (var i = 0; i<orderedPlayingStrategies.length; i++) {
    const key = orderedPlayingStrategies[i]
    if (key !== args[0]) {
        otherGamePromises.push(
            () => {
                return playGamesAgainstSpecificOpponent(300, playingStrategies[key], true).then((result) => {
                    const percentage = result / 3
                    // console.log(percentage + '%' + ' - ' + key)
                    console.log(percentage + '%')
                })
            }
        )
    }
}

for (var i = 0; i<orderedCallingStrategies.length; i++) {
    const key = orderedCallingStrategies[i]
    if (key !== args[0]) {
        otherGamePromises.push(
            () => {
                return playGamesAgainstSpecificOpponent(300, callingStrategies[key], false).then((result) => {
                    const percentage = result / 3
                    // console.log(percentage + '% - ' + key)
                    console.log(percentage + '%')
                })
            }
        )
    }
}

const playAgainstRandomOpponents = sequential(promises).then(() => {
    const percent = totalWins / 5000 * 100
    // console.log(percent + '% - Wins against random opponents with 5000 plays')
    console.log(percent + '%')
});

playAgainstRandomOpponents.then(() => {
    const playAgainstSpecificOpponents = sequential(otherGamePromises)
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
            return current()
        })
    }, Promise.resolve())
}
