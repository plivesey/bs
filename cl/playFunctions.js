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

exports.AlwaysLieOnSingles = class AlwaysLieOnSingles {
    playHand(state) {
        var cards = []
        for (var i = 0; i < state.hand[state.currentCard]; i++) {
            cards.push(state.currentCard)
        }

        state.hand[state.currentCard] = 0

        if (state.hand.count() > 0 && cards.length <= 1) {
            cards.push(ideaLyingCardFromHand(state.hand, state.currentCard))
        }

        return cards
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

class ExpectedValueLiar {
    constructor() {
        // Initialize each probability with 50%
        this.oneCard = {
            bsCalled: 1,
            bsNotCalled: 1
        }

        this.twoCards = {
            bsCalled: 1,
            bsNotCalled: 1
        }

        this.threeCards = {
            bsCalled: 1,
            bsNotCalled: 1
        }
    }

    probabilityOfBS(numberOfCards) {
        if (numberOfCards === 1) {
            return this.oneCard.bsCalled / (this.oneCard.bsNotCalled + this.oneCard.bsCalled)
        } else if (numberOfCards === 2) {
            return this.twoCards.bsCalled / (this.twoCards.bsNotCalled + this.twoCards.bsCalled)
        } else if (numberOfCards === 3) {
            return this.threeCards.bsCalled / (this.threeCards.bsNotCalled + this.threeCards.bsCalled)
        } else {
            assert('number of cards is not 1, 2 or 3')
            return 1
        }
    }

    expectedValue(numberOfCards, discardSize, bluffing) {
        if (!bluffing) {
            // You will always get rid of exactly these cards
            return numberOfCards
        } else {
            const chanceOfBS = this.probabilityOfBS(numberOfCards)
            return (1 - chanceOfBS) * numberOfCards - chanceOfBS * discardSize
        }
    }

    playHand(state) {
        var cards = []
        for (var i = 0; i < state.hand[state.currentCard]; i++) {
            cards.push(state.currentCard)
        }

        state.hand[state.currentCard] = 0

        if (cards.length === 4) {
            return cards
        }

        const expectedValueForOneCard = this.expectedValue(1, state.discardSize, cards.length < 1)
        const expectedValueForTwoCards = this.expectedValue(2, state.discardSize, cards.length < 2)
        const expectedValueForThreeCards = this.expectedValue(3, state.discardSize, cards.length < 3)

        var extraCards = 0
        if (expectedValueForOneCard > expectedValueForTwoCards && expectedValueForOneCard > expectedValueForThreeCards) {
            extraCards = 1 - cards.length
        } else if (expectedValueForTwoCards > expectedValueForOneCard && expectedValueForTwoCards > expectedValueForThreeCards) {
            extraCards = 2 - cards.length
        } else {
            // Let's do three cards
            extraCards = 3 - cards.length
        }

        // console.log(this)
        const handCount = state.hand.count() + cards.length
        // console.log('hand count: ' + handCount + ' current hand: ' + cards + ' extra cards: ' + extraCards + ' discard: ' + state.discardSize + ' values: ' + expectedValueForOneCard + ' - ' + expectedValueForTwoCards + ' - ' + expectedValueForThreeCards)

        for (var i = 0; i<extraCards; i++) {
            if (state.hand.count() > 0 && cards.length < 4) {
                var card = ideaLyingCardFromHand(state.hand, state.currentCard)
                cards.push(ideaLyingCardFromHand(state.hand, state.currentCard))
                state.hand[card]--
            }
        }

        // console.log('result: ' + cards)

        return cards
    }

    roundSummary(summary) {
        if (summary.bullshitCalled && summary.callingPlayer === 0) {
            // Bullshit was called by me, so don't count this towards totals
            return
        }

        if (summary.numberOfCardsPlayed === 1) {
            if (summary.bullshitCalled) {
                this.oneCard.bsCalled++
            } else {
                this.oneCard.bsNotCalled++
            }
        } else if (summary.numberOfCardsPlayed === 2) {
            if (summary.bullshitCalled) {
                this.twoCards.bsCalled++
            } else {
                this.twoCards.bsNotCalled++
            }
        } else if (summary.numberOfCardsPlayed === 3) {
            if (summary.bullshitCalled) {
                this.threeCards.bsCalled++
            } else {
                this.threeCards.bsNotCalled++
            }
        }
    }
}

exports.ExpectedValueLiar = ExpectedValueLiar

exports.LyingCloser = class LyingCloser extends LiePercentage {
    constructor() {
        super(1)
    }

    playHand(state) {
        const closing = canFinishWithoutLying(state.currentCard, state.hand, 0)

        var cards = []
        for (var i = 0; i < state.hand[state.currentCard]; i++) {
            cards.push(state.currentCard)
        }

        if (closing) {
            return cards
        } else {
            return super.playHand(state)
        }
    }
}

exports.Closer = class Closer extends ExpectedValueLiar {
    playHand(state) {
        const closing = canFinishWithoutLying(state.currentCard, state.hand, 0)

        var cards = []
        for (var i = 0; i < state.hand[state.currentCard]; i++) {
            cards.push(state.currentCard)
        }

        state.hand[state.currentCard] = 0

        if (cards.length === 4) {
            return cards
        } else {
            if (closing) {
                return cards
            } else {
                return super.playHand(state)
            }
        }
    }
}

exports.RallyTime = class RallyTime extends LiePercentage {
    constructor() {
        super(0)
    }

    playHand(state) {
        if (state.hand.count() >= state.otherPlayerCards[0] && state.hand.count() >= state.otherPlayerCards[1] && state.hand.count() >= state.otherPlayerCards[2]) {
            this.percentage = 1
        } else {
            this.percentage = 0
        }

        return super.playHand(state)
    }
}

function ideaLyingCardFromHand(hand, currentTurn) {
    if (hand.count() === 0) {
        assert(false, 'empty hand in ideaLyingCardFromHand')
    }

    while (true) {
        currentTurn -= 4
        if (currentTurn < 1) {
            currentTurn += 13
        }

        if (hand[currentTurn] > 0) {
            return currentTurn
        }
    }
}

function canFinishWithoutLying(currentCard, hand, numberOfCardsUsed) {
    if (hand.count() >= numberOfCardsUsed) {
        return true
    }

    if (hand[currentCard] === 0) {
        return false
    }

    var nextCard = currentCard + 4
    if (nextCard > 13) {
        nextCard -= 13
    }

    return this.canFinishWithoutLying(nextCard, hand, numberOfCardsUsed + hand[currentCard])
}
