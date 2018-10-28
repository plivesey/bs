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
        // So, these are the indexes of the other players
        gameState.otherPlayerIndexes = [(player + 1) % 4, (player + 2) % 4, (player + 3) % 4 ]
        
        gameState.otherPlayerCards = [
            this.hands[gameState.otherPlayerIndexes[0]].count(), 
            this.hands[gameState.otherPlayerIndexes[1]].count(), 
            this.hands[gameState.otherPlayerIndexes[2]].count()
        ]

        gameState.hand = Object.assign(new Hand(), this.hands[player])
        gameState.discardSize = this.discard.length
        gameState.currentCard = this.currentCard

        return gameState
    }

    playGame() {
        return this.playTurn().then((result) => {
            const winner = this.gameWon()
            if (winner !== false) {
                return winner
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

        return false
    }

    playTurn() {
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

            function askForBullshit(index, players) {
                return players[index].callBullshit().then((result) => {
                    if (result) {
                        return index
                    } else {
                        if (index + 1 < players.length) {
                            return askForBullshit(index + 1, players)
                        } else {
                            return -1
                        }
                    }
                })
            }

            const otherPlayers = [
                this.players[gameState.otherPlayerIndexes[0]], 
                this.players[gameState.otherPlayerIndexes[1]], 
                this.players[gameState.otherPlayerIndexes[2]]
            ]

            return askForBullshit(0, otherPlayers).then((result) => {
                if (result == -1) {
                    // No-one called bullshit, so let's just continue
                } else {
                    if (this.validPlay(discardedCards)) {
                        const losingPlayerActualIndex = (this.turn + result + 1) % 4
                        this.hands[losingPlayerActualIndex].addCards(this.discard)
                        this.discard = []
                    } else {
                        this.hands[this.turn].addCards(this.discard)
                        this.discard = []
                    }
                }

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

    validPlay(discardedCards) {
        for (var i = 0; i<discardedCards.length; i++) {
            if (discardedCards[i] != this.currentCard) {
                return false
            }
        }

        return true
    }
}

class Hand {
    count() {
        var total = 0
        for (var i = 1; i<=13; i++) {
            total += this[i]
        }
        return total
    }

    addCards(cards) {
        cards.forEach(card => {
            this[card]++
        })
    }

    toString() {
        var cards = []
        for (var i = 1; i<=13; i++) {
            for (var j = 0; j<this[i]; j++) {
                cards.push(i)
            }
        }
        return '' + cards
    }
}

class Deck {
    constructor() {
        this.cards = []
        for (var i = 1; i<=13; i++) {
            for (var j = 0; j<4; j++) {
                this.cards.push(i)
            }
        }
    }

    dealHands() {
        const hands = []
        for (var n = 0; n < 4; n++) {
            const hand = new Hand()
            for (var i = 1; i<=13; i++) {
                hand[i] = 0
            }

            for (var cardIndex = n * 13; cardIndex < (n+1) * 13; cardIndex++) {
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
        return Math.floor(Math.random()*this.cards.length)
    }
}

exports.Game = Game
