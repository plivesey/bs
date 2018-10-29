const assert = require('assert');

class Player {
    playHand(state) {
        assert(false, 'You must overwrite this function')
    }

    callBullshit(state) {
        assert(false, 'You must overwrite this function')
        return new Promise((resolve) => {
            resolve(false)
        })
    }

    roundSummary(summary) {
        return new Promise((resolve) => {
            resolve()
        })
    }
}

class SyncPlayer extends Player {
    constructor(playHandPlayer, callBullshitPlayer) {
        super()

        this.syncPlayHand = (state) => {
            return playHandPlayer.playHand(state)
        }

        this.syncCallBullshit = (state) => {
            return callBullshitPlayer.callBullshit(state)
        }

        this.syncRoundSummary = (summary) => {
            if (playHandPlayer.roundSummary) {
                playHandPlayer.roundSummary(summary)
            }

            if (callBullshitPlayer.roundSummary) {
                callBullshitPlayer.roundSummary(summary)
            }
        }
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

    roundSummary(summary) {
        return new Promise((resolve) => {
            this.syncRoundSummary(summary)
            resolve()
        })
    }
}

exports.Player = Player
exports.SyncPlayer = SyncPlayer
