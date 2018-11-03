import React, { Component } from 'react';
import './App.css';
import { Game } from 'cl/game'
import { Player, SyncPlayer } from 'cl/player'
import { NeverCall, CallUpdatingPercentage, CallPercentageOnWinner, CallIfLieNeeded } from 'cl/callFunctions'
import { AvoidLying, RallyCloser, Lie10Percent, RallyTime } from 'cl/playFunctions'

const playingStrategies = {
  'AvoidLying': AvoidLying,
  'RallyCloser': RallyCloser,
  'Lie10Percent': Lie10Percent,
  'RallyTime': RallyTime
}

const callingStrategies = {
  'NeverCall': NeverCall,
  'CallUpdatingPercentage': CallUpdatingPercentage,
  'CallPercentageOnWinner': CallPercentageOnWinner,
  'CallIfLieNeeded': CallIfLieNeeded
}

class HumanPlayer extends Player {
  constructor(onStateChange) {
    super()

    this.onStateChange = onStateChange
  }

  playHand(state) {
    return new Promise((resolve) => {
      state.playing = true
      state.summary = false
      state.cardsToPlay = []
      this.onStateChange(state)
      this.resolvePlayHand = resolve
    })
  }

  callBullshit(state) {
    return new Promise((resolve) => {
      state.playing = false
      state.summary = false
      this.onStateChange(state)
      this.resolveCallBullshit = resolve
    })
  }

  roundSummary(summary) {
    return new Promise((resolve) => {
      summary.playing = false
      summary.summary = true
      this.onStateChange(summary)
      this.resolveSummary = resolve
    })
  }
}

class GameComponenet extends Component {
  constructor(props) {
    super(props)

    this.stateChanged = this.stateChanged.bind(this)

    this.state = {}
  }

  stateChanged(state) {
    state.hand = state.hand.toArray()
    this.setState(state)
  }

  componentDidMount() {
    this.startNewGame()
  }

  startNewGame() {
    const goodPlayingStrategies = [
      'AvoidLying',
      'RallyCloser',
      'Lie10Percent',
      'RallyTime'
    ]

    const goodCallingStrategies = [
      'NeverCall',
      'CallUpdatingPercentage',
      'CallPercentageOnWinner',
      'CallIfLieNeeded'
    ]

    function randomArrayElement(array) {
      return array[Math.floor(Math.random() * array.length)]
    }

    const otherPlayerStrategies = [
      {
        play: randomArrayElement(goodPlayingStrategies),
        call: randomArrayElement(goodCallingStrategies),
      },
      {
        play: randomArrayElement(goodPlayingStrategies),
        call: randomArrayElement(goodCallingStrategies),
      },
      {
        play: randomArrayElement(goodPlayingStrategies),
        call: randomArrayElement(goodCallingStrategies),
      }
    ]

    const player = new HumanPlayer(this.stateChanged)
    const player2 = new SyncPlayer(new playingStrategies[otherPlayerStrategies[0].play](), new callingStrategies[otherPlayerStrategies[0].call]())
    const player3 = new SyncPlayer(new playingStrategies[otherPlayerStrategies[1].play](), new callingStrategies[otherPlayerStrategies[1].call]())
    const player4 = new SyncPlayer(new playingStrategies[otherPlayerStrategies[2].play](), new callingStrategies[otherPlayerStrategies[2].call]())

    const game = new Game([player, player2, player3, player4])
    game.playGame().then((winningPlayer) => {
      this.setState({
        winningPlayer: winningPlayer,
        gameOver: true
      })
    })

    this.setState({
      player: player,
      game: game,
      winningPlayer: undefined,
      gameOver: false,
      otherPlayerStrategies: otherPlayerStrategies
    })
  }

  cardsToAdd(cards) {
    const cardLinks = cards.map((card, index) => {
      return (
        <button onClick={() => {
          var hand = this.state.hand
          hand.splice(index, 1)
          var cardsToPlay = this.state.cardsToPlay || []
          cardsToPlay.push(card)
          this.setState({
            hand: hand,
            cardsToPlay: cardsToPlay
          })
        }}
          key={index}>{card}</button>
      )
    })

    return (
      <div>
        {cardLinks}
      </div>
    )
  }

  cardsToRemove(cards) {
    const cardLinks = cards.map((card, index) => {
      return (
        <button onClick={() => {
          var hand = this.state.hand
          hand.push(card)
          var cardsToPlay = this.state.cardsToPlay || []
          cardsToPlay.splice(index, 1)
          this.setState({
            hand: hand,
            cardsToPlay: cardsToPlay
          })
        }}
          key={index}>{card}</button>
      )
    })

    return (
      <div>
        {cardLinks}
      </div>
    )
  }

  playCardsComponent() {
    var playCards
    if (this.state.cardsToPlay.length > 0) {
      playCards = (
        <div>
          <button onClick={() => { this.state.player.resolvePlayHand(this.state.cardsToPlay) }}>Play Cards!</button>
        </div>
      )
    } else {
      playCards = (<div></div>)
    }

    var hand = this.cardsToAdd(this.state.hand || [])

    return (
      <div>
        <div>
          Your hand: {hand}
        </div>
        <div>
          Discard size: {this.state.discardSize}
        </div>
        <div>
          Player 2 has {this.state.otherPlayerCards[0]} cards. Player 3 has {this.state.otherPlayerCards[1]} cards. Player 4 has {this.state.otherPlayerCards[2]} cards.
        </div>
        <div>
          Current card: {this.state.currentCard}
        </div>
        <div>
          Tap cards to add them to your hand.
      </div>
        <div>
          You are about to play: {this.cardsToRemove(this.state.cardsToPlay || [])}
        </div>
        {playCards}
      </div>
    )
  }

  summaryComponent() {
    var text
    var playingPlayer = this.state.playerTurn + 1
    if (this.state.bullshitCalled) {
      var callingPlayer = this.state.callingPlayer + 1
      text = 'On the last turn, bullshit was called by player ' + callingPlayer + '. '
      if (this.state.playerLied) {
        text += 'The player was lying and actually played: ' + this.state.actualCards
      } else {
        text += 'The player was telling the truth! (' + this.state.actualCards + '). Player ' + callingPlayer + ' has to pick up the discard pile.'
      }
    } else {
      text = 'On the last turn, player ' + playingPlayer + ' played ' + this.state.numberOfCardsPlayed + ' cards and no-one called bullshit.'
    }
    return (
      <div>
        <div>
          Current card: {this.state.currentCard}
        </div>
        <div>
          {text}
        </div>
        <div>
          Discard size: {this.state.discardSize}
        </div>
        <div>
          <button onClick={() => { this.state.player.resolveSummary() }}>OK</button>
        </div>
      </div>
    )
  }

  bullshitComponent() {
    return (
      <div>
        <div>
          Do you want to call bullshit on player {this.state.playerTurn + 1}?
          </div>
        <div>
          Your hand: {'' + this.state.hand}
        </div>
        <div>
          Current card: {this.state.currentCard}
        </div>
        <div>
          Number of cards played: {this.state.numberOfCardsPlayed}
        </div>
        <div>
          Player 2 has {this.state.otherPlayerCards[0]} cards. Player 3 has {this.state.otherPlayerCards[1]} cards. Player 4 has {this.state.otherPlayerCards[2]} cards.
        </div>
        <div>
          Discard size: {this.state.discardSize}
        </div>
        <div>
          <button onClick={() => { this.state.player.resolveCallBullshit(true) }}>Yes!</button>
          <button onClick={() => { this.state.player.resolveCallBullshit(false) }}>No...</button>
        </div>
      </div>
    )
  }

  opponentDescription(index) {
    const playingDescription = {
      'AvoidLying': 'Avoids lying whenever possible',
      'RallyCloser': "If they can win without lying, they don't lie. Otherwise, they lie only when they are losing",
      'Lie10Percent': "Lies ten percent of the time",
      'RallyTime': "Only lies when losing"
    }
    
    const callingDescriptions = {
      'NeverCall': 'never calls bullshit unless they would immediately lose.',
      'CallUpdatingPercentage': 'keeps track of how many people lie and calls bullshit if they lie often.',
      'CallPercentageOnWinner': 'only calls bullshit on the winner every so often.',
      'CallIfLieNeeded': 'only calls bullshit if they would need to lie on their next turn.'
    }
    
    const opponent = this.state.otherPlayerStrategies[index]

    const text = playingDescription[opponent.play] + ', and ' + callingDescriptions[opponent.call]

    return text
  }

  playingAgainst() {
    return (
      <div>
        <div>
          You were playing against:
        </div>
        <div>
          Player 2: {this.opponentDescription(0)}
        </div>
        <div>
          Player 3: {this.opponentDescription(1)}
        </div>
        <div>
          Player 4: {this.opponentDescription(2)}
        </div>
      </div>
    )
  }

  render() {
    if (this.state.gameOver) {
      var winText
      if (this.state.winningPlayer === 0) {
        winText = 'You won! Contrats :D.'
      } else {
        var player = this.state.winningPlayer + 1
        winText = 'Player ' + player + ' won the game. Sorry, you lost.'
      }

      return (
        <div>
          <div>
            {winText}
          </div>
          {this.playingAgainst()}
          <div>
            <button onClick={() => { this.startNewGame() }}>Play again</button>
          </div>
        </div>
      )
    } else if (!this.state.hand) {
      return (
        <div>Loading...</div>
      )
    }

    var mainComponent

    if (this.state.playing) {
      mainComponent = this.playCardsComponent()
    } else if (this.state.summary) {
      mainComponent = this.summaryComponent()
    } else {
      mainComponent = this.bullshitComponent()
    }

    return (
      <div>
        {mainComponent}
      </div>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  startGame() {
    this.setState({ playingGame: true })
  }

  render() {
    var mainContent

    if (this.state.playingGame) {
      mainContent = (
        <div>
          <GameComponenet />
        </div>
      )
    } else {
      mainContent = (
        <div>
          <button onClick={() => { this.startGame() }}>Start Game</button>
        </div>
      )
    }

    return (
      <div className="App">
        <header className="App-header">
          <h1>BS</h1>
        </header>
        {mainContent}
      </div>
    );
  }
}

export default App
