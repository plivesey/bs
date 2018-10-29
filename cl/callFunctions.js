const Player = require('./player.js').Player

exports.NeverCall = class NeverCall {
    callBullshit() {
        return false
    }
}

exports.CallPercentage = class CallPercentage {
    constructor(percentage) {
        this.percentage = percentage
    }

    callBullshit() {
        return Math.random() < this.percentage
    }
}
