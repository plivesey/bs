exports.avoidLying = function(state) {
    var cards = []
    for (var i = 0; i < state.hand[state.currentCard]; i++) {
        cards.push(state.currentCard)
    }

    if (cards.length > 0) {
        return cards
    } else {
        return randomCardFromHand(state.hand)
    }
}

function randomCardFromHand(hand) {
    for (var i = 1; i <= 13; i++) {
        if (hand[i] > 0) {
            return [i]
        }
    }

    return [1]
}