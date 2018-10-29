const Game = require('./game.js').Game
const SyncPlayer = require('./player.js').SyncPlayer

const AvoidLying = require('./playFunctions').AvoidLying
const NeverCall = require('./callFunctions').NeverCall
const CallPercentage = require('./callFunctions').CallPercentage

const player1 = new SyncPlayer(new AvoidLying(), new NeverCall())
const player2 = new SyncPlayer(new AvoidLying(), new NeverCall())
const player3 = new SyncPlayer(new AvoidLying(), new NeverCall())
const player4 = new SyncPlayer(new AvoidLying(), new CallPercentage(0.5))

const game = new Game([player1, player2, player3, player4])
game.playGame().then((result) => {
    console.log('Winner: ' + result)
})

