const assert = require('assert');

exports.AvoidLying = class AvoidLying {
    playHand(state) {
        var cards = []
        for (var i = 0; i < state.hand[state.currentCard]; i++) {
            cards.push(state.currentCard)
        }
    
        if (cards.length > 0) {
            return cards
        } else {
            return ideaLyingCardFromHand(state.hand, state.currentCard)
        }
    }
}

class LiePercentage {
    constructor(percentage) {
        this.percentage = percentage
    }

    playHand(state) {
        var cards = []
        for (var i = 0; i < state.hand[state.currentCard]; i++) {
            cards.push(state.currentCard)
        }

        state.hand[state.currentCard] = 0
    
        if (cards.length > 0) {
            if (Math.random() < this.percentage && state.hand.count() > 0 && cards.length < 4) {
                cards.push(ideaLyingCardFromHand(state.hand, state.currentCard))
            }

            return cards
        } else {
            return ideaLyingCardFromHand(state.hand, state.currentCard)
        }
    }
}

exports.Lie10Percent = class Lie10Percent extends LiePercentage {
    constructor() {
        super(0.1)
    }
}

exports.Lie50Percent = class Lie10Percent extends LiePercentage {
    constructor() {
        super(0.5)
    }
}

exports.AlwaysLie = class AlwaysLie extends LiePercentage {
    constructor() {
        super(1)
    }
}

function ideaLyingCardFromHand(hand, currentTurn) {
    if (hand.count() === 0) {
        assert(false, 'empty hand in ideaLyingCardFromHand')
    }

    while(true) {
        currentTurn -= 4
        if (currentTurn < 1) {
            currentTurn += 13
        }

        if (hand[currentTurn] > 0) {
            return currentTurn
        }
    }
}