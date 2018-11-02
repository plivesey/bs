const assert = require('assert');

const Player = require('./player.js').Player
const SyncPlayer = require('./player.js').SyncPlayer

class Game {
    constructor(players) {
        const deck = new Deck()
        deck.shuffle()

        this.players = players
        this.hands = deck.dealHands()
        this.discard = []
        this.turn = 0
        this.currentCard = 1
    }

    gameStateForPlayer(player) {
        const gameState = {}

        // The current player is always indexed to zero
        // So, these are the indexes of the other playerss        
        gameState.otherPlayerCards = [
            this.hands[this.adjustedIndexForPlayerGivenTurn(player, 1)].count(),
            this.hands[this.adjustedIndexForPlayerGivenTurn(player, 2)].count(),
            this.hands[this.adjustedIndexForPlayerGivenTurn(player, 3)].count()
        ]

        gameState.hand = Object.assign(new Hand(), this.hands[player])
        gameState.discardSize = this.discard.length
        gameState.currentCard = this.currentCard

        return gameState
    }

    bullshitStateForPlayer(player, numberOfCardsPlayed) {
        const state = this.gameStateForPlayer(player)
        state.playerTurn = this.indexOfPlayerInRelationToCurrentPlayer(this.turn, player)
        state.numberOfCardsPlayed = numberOfCardsPlayed
        return state
    }

    summaryState(player, cardsPlayed, bullshitCalled, callingPlayer, playerLied) {
        const state = this.bullshitStateForPlayer(player, cardsPlayed.length)
        state.bullshitCalled = bullshitCalled
        state.callingPlayer = callingPlayer
        state.playerLied = playerLied
        const revealCards = bullshitCalled || player === this.turn
        state.actualCards = revealCards ? cardsPlayed : []
        return state
    }

    playGame() {
        return this.playTurn().then((result) => {
            const winner = this.gameWon()
            if (winner >= 0) {
                return winner
            } else if (this.gameDrawn()) {
                return -1
            } else {
                return this.playGame()
            }
        })
    }

    gameWon() {
        for (var i = 0; i < this.hands.length; i++) {
            if (this.hands[i].count() == 0) {
                return i
            }
        }

        return -1
    }

    gameDrawn() {
        if (this.turnNumber > 10000) {
            return true
        }

        return this.hands[0].drawnHand() && this.hands[1].drawnHand() && this.hands[2].drawnHand() && this.hands[3].drawnHand()
    }

    playTurn() {
        if (!this.turnNumber) {
            this.turnNumber = 0
        }

        this.turnNumber++

        const gameState = this.gameStateForPlayer(this.turn)

        // Ask the player what he wants to do
        return this.players[this.turn].playHand(gameState).then((discardedCards) => {
            const hand = this.hands[this.turn]

            // Discard the cards
            for (var i = 0; i < discardedCards.length; i++) {
                var card = discardedCards[i]
                assert(hand[card] > 0, 'Card doesnt exist in hand: ' + card + ' hand: ' + hand)

                hand[card]--

                this.discard.push(card)
            }

            return this.askEachPlayerForBullshit(discardedCards).then(() => {
                // Advance gamestate
                this.turn++
                this.turn = this.turn % 4

                this.currentCard++
                if (this.currentCard > 13) {
                    this.currentCard = 1
                }
            })
        })
    }

    askEachPlayerForBullshit(discardedCards) {
        const otherPlayers = [
            this.players[this.adjustedIndexForPlayerGivenTurn(this.turn, 1)],
            this.players[this.adjustedIndexForPlayerGivenTurn(this.turn, 2)],
            this.players[this.adjustedIndexForPlayerGivenTurn(this.turn, 3)]
        ]

        return this.askForBullshit(discardedCards.length, 0, otherPlayers).then((result) => {
            const bullshitCalled = result !== -1
            var playerLied = false
            if (bullshitCalled) {
                if (this.validPlay(discardedCards)) {
                    const losingPlayerActualIndex = this.originalIndexFromAdjustedIndex(this.turn, result)
                    this.hands[losingPlayerActualIndex].addCards(this.discard)
                    this.discard = []
                } else {
                    playerLied = true
                    this.hands[this.turn].addCards(this.discard)
                    this.discard = []
                }
            }

            const callingPlayerIndex = bullshitCalled ? this.originalIndexFromAdjustedIndex(this.turn, result) : 0
            return this.informPlayersOfRoundSummary(0, discardedCards, bullshitCalled, callingPlayerIndex, playerLied)
        })
    }

    informPlayersOfRoundSummary(playerIndex, cardsPlayed, bullshitCalled, callingPlayer, playerLied) {
        const callingPlayerAdjusted = bullshitCalled ? this.indexOfPlayerInRelationToCurrentPlayer(callingPlayer, playerIndex) : 0
        const state = this.summaryState(playerIndex, cardsPlayed, bullshitCalled, callingPlayerAdjusted, playerLied)
        
        return this.players[playerIndex].roundSummary(state).then(() => {
            if (playerIndex + 1 < 4) {
                return this.informPlayersOfRoundSummary(playerIndex + 1, cardsPlayed, bullshitCalled, callingPlayer, playerLied)
            }
        })
    }

    askForBullshit(numberOfCardsPlayed, index, players) {
        const currentPlayerIndex = this.originalIndexFromAdjustedIndex(this.turn, index)

        return players[index].callBullshit(this.bullshitStateForPlayer(currentPlayerIndex, numberOfCardsPlayed)).then((result) => {
            if (result) {
                return index
            } else {
                if (index + 1 < players.length) {
                    return this.askForBullshit(numberOfCardsPlayed, index + 1, players)
                } else {
                    return -1
                }
            }
        })
    }

    validPlay(discardedCards) {
        for (var i = 0; i < discardedCards.length; i++) {
            if (discardedCards[i] != this.currentCard) {
                return false
            }
        }

        return true
    }

    indexOfPlayerInRelationToCurrentPlayer(actualIndex, currentPlayerIndex) {
        // You want to find the difference between the current player and the actual player
        // Add 4 because otherwise, it could be negative
        return (4 + (actualIndex - currentPlayerIndex)) % 4
    }

    adjustedIndexForPlayerGivenTurn(turn, index) {
        return (turn + index) % 4
    }

    originalIndexFromAdjustedIndex(turn, index) {
        return (turn + index + 1) % 4
    }
}

class Hand {
    count() {
        var total = 0
        for (var i = 1; i <= 13; i++) {
            total += this[i]
        }
        return total
    }

    drawnHand() {
        for (var i = 1; i <= 13; i++) {
            if (this[i] != 4 || this[i] !== 0) {
                return false
            }
        }

        return true
    }

    addCards(cards) {
        cards.forEach(card => {
            this[card]++
        })
    }

    toString() {
        var cards = []
        for (var i = 1; i <= 13; i++) {
            for (var j = 0; j < this[i]; j++) {
                cards.push(i)
            }
        }
        return '' + cards
    }
}

class Deck {
    constructor() {
        this.cards = []
        for (var i = 1; i <= 13; i++) {
            for (var j = 0; j < 4; j++) {
                this.cards.push(i)
            }
        }
    }

    dealHands() {
        const hands = []
        for (var n = 0; n < 4; n++) {
            const hand = new Hand()
            for (var i = 1; i <= 13; i++) {
                hand[i] = 0
            }

            for (var cardIndex = n * 13; cardIndex < (n + 1) * 13; cardIndex++) {
                hand[this.cards[cardIndex]]++
            }

            hands.push(hand)
        }

        return hands
    }

    shuffle() {
        var newCards = []
        while (this.cards.length > 0) {
            const index = this.randomIndex()
            newCards.push(this.cards[index])
            this.cards.splice(index, 1)
        }
        this.cards = newCards
    }

    randomIndex() {
        return Math.floor(Math.random() * this.cards.length)
    }
}

exports.Game = Game
