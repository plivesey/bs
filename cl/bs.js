const assert = require('assert');

const Game = require('./game').Game
const SyncPlayer = require('./player').SyncPlayer

const args = process.argv.slice(2);

const playingStrategies = {
    'AvoidLying': require('./playFunctions').AvoidLying,
    'Lie10Percent': require('./playFunctions').Lie10Percent,
    'Lie50Percent': require('./playFunctions').Lie50Percent,
    'AlwaysLie': require('./playFunctions').AlwaysLie
}

const callingStrategies = {
    'NeverCall': require('./callFunctions').NeverCall,
    'Call10Percent': require('./callFunctions').Call10Percent,
    'Call50Percent': require('./callFunctions').Call50Percent,
    'CallUpdatingPercentage': require('./callFunctions').CallUpdatingPercentage,
    'CallPercentageOnWinner': require('./callFunctions').CallPercentageOnWinner,
    'CallUnlikely': require('./callFunctions').CallUnlikely
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

var winCount = 0
var total = 0
for (var i = 0; i < 1000; i++) {
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
    game.playGame().then((result) => {
        if (result === playerNumber) {
            winCount++;
        } else if (result === -1) {
            winCount += 0.25
        }

        total++;

        if (total === 1000) {
            console.log(winCount + ' / ' + total)
        }
    })
}

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
