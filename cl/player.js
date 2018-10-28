const assert = require('assert');

class Player {
    playHand(state) {
        assert(false, 'You must overwrite this function')
    }

    callBullshit(state) {
        assert(false, 'You must overwrite this function')
        return new Promise(function(resolve) {
            resolve(false)
        })
    }
}

class SyncPlayer extends Player {
    constructor(playHand, callBullshit) {
        super()
        
        this.syncPlayHand = playHand
        this.syncCallBullshit = callBullshit
    }

    playHand(state) {
        return new Promise((resolve) => {
            resolve(this.syncPlayHand(state))
        }) 
    }

    callBullshit(state) {
        return new Promise((resolve) => {
            resolve(this.syncCallBullshit(state))
        })
    }
}

exports.Player = Player
exports.SyncPlayer = SyncPlayer
