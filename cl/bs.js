const Game = require('./game.js').Game
const SyncPlayer = require('./player.js').SyncPlayer

const avoidLying = require('./playFunctions').avoidLying
const neverCall = require('./callFunctions').neverCall
const callPercentage = require('./callFunctions').callPercentage

const player1 = new SyncPlayer(avoidLying, neverCall)
const player2 = new SyncPlayer(avoidLying, neverCall)
const player3 = new SyncPlayer(avoidLying, neverCall)
const player4 = new SyncPlayer(avoidLying, callPercentage)

const game = new Game([player1, player2, player3, player4])
game.playGame().then((result) => {
    console.log('Winner: ' + result)
})

