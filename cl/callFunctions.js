const Player = require('./player.js').Player

function alwaysCall(state) {
    if (state.playerTurn == 3 && state.otherPlayerCards[2] === 0) {
        return true
    } else if (state.numberOfCardsPlayed + state.hand[state.currentCard] > 4) {
        return true
    } else {
        return false
    }
}

exports.NeverCall = class NeverCall {
    callBullshit(state) {
        if (alwaysCall(state)) {
            return true
        }

        return false
    }
}

class CallPercentage {
    constructor(percentage) {
        this.percentage = percentage
    }

    callBullshit(state) {
        if (alwaysCall(state)) {
            return true
        }

        return Math.random() < this.percentage
    }
}

exports.Call10Percent = class Lie10Percent extends CallPercentage {
    constructor() {
        super(0.1)
    }
}

exports.Call50Percent = class Lie10Percent extends CallPercentage {
    constructor() {
        super(0.5)
    }
}

/**
 * Starts with a chance of calling out each player. Then, doubles this every time the player lies and halves it when they don't lie.
 */
exports.CallUpdatingPercentage = class CallUpdatingPercentage {
    constructor(percentage) {
        this.percentages = {
            1: percentage,
            2: percentage,
            3: percentage
        }
    }

    callBullshit(state) {
        if (alwaysCall(state)) {
            return true
        }

        return Math.random() < this.percentages[state.playerTurn]
    }

    roundSummary(summary) {
        if (summary.bullshitCalled) {
            if (summary.playerLied) {
                this.percentages[summary.playerTurn] *= 2
            } else {
                this.percentages[summary.playerTurn] /= 2
            }
        }
    }
}

function factorial(x) {
    if (x <= 0) {
        return 1
    }

    return x * factorial(x - 1)
}

function choose(n, k) {
    return factorial(n) / (factorial(k) * factorial(n - k))
}

exports.CallPercentageOnWinner = class CallPercentageOnWinner {
    constructor(percentage) {
        this.percentage = percentage
    }

    callBullshit(state) {
        if (alwaysCall(state)) {
            return true
        }

        const allHands = state.otherPlayerCards
        allHands.push(state.hand.count())
        const winningNumberOfCards = Math.min(...allHands)

        if (state.otherPlayerCards[state.playerTurn - 1] !== winningNumberOfCards) {
            return false
        }

        return Math.random() < this.percentage
    }
}

function chanceOfHavingASpecificCard(handSize, cardsLeft, numberOfSpecificCards, deckSize) {
    if (handSize - numberOfSpecificCards < 0) {
        return 0
    }

    const totalPossibleHands = choose(deckSize, handSize)
    const numberOfHandsWithNoCards = deckSize - cardsLeft >= handSize ? choose((deckSize - cardsLeft), handSize) : 0
    const probabilityOfNoCards = numberOfHandsWithNoCards / totalPossibleHands
    const probabilityOfMoreThanOneCard = 1 - probabilityOfNoCards

    if (numberOfSpecificCards === 1) {
        return probabilityOfMoreThanOneCard
    } else {
        const totalHandsWithExactlyOneCard = choose(cardsLeft, 1) * choose(deckSize - cardsLeft, handSize - 1)
        const probabilityOfExactlyOneCard = totalHandsWithExactlyOneCard / totalPossibleHands

        const probabilityOfNoCards = (1 - chanceOfHavingASpecificCard(handSize, cardsLeft, 1, deckSize))

        if (numberOfSpecificCards === 2) {
            return 1 - probabilityOfNoCards - probabilityOfExactlyOneCard
        } else if (numberOfSpecificCards === 3) {
            const totalHandsWithExactlyTwoCards = choose(cardsLeft, 2) * choose(deckSize - cardsLeft, handSize - 2)
            const probabilityOfExactlyTwoCards = totalHandsWithExactlyTwoCards / totalPossibleHands
            
            return 1 - probabilityOfNoCards - probabilityOfExactlyOneCard - probabilityOfExactlyTwoCards
        } else {
            // If they are claiming 4 of a kind, wait for someone else to call bullshit
            return 1
        }
    }
}

exports.CallUnlikely = class CallUnlikely {
    callBullshit(state) {
        if (alwaysCall(state)) {
            return true
        }

        const hand = state.hand
        const currentCard = state.currentCard
        const numberOfCardsPlayed = state.numberOfCardsPlayed
        const playerCards = state.otherPlayerCards[state.playerTurn - 1]

        return chanceOfHavingASpecificCard(playerCards, 4 - hand[currentCard], numberOfCardsPlayed, 52 - hand.count()) < 0.1
    }
}
