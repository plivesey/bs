# bs
Coded strategies to determine the best way to bluff and call in the card game bullshit

## Overview

There are two projects within this project. One is the command line tool which is in the folder `cl`. The other is the web application which is under `bs-web`.

You can see the web app at https://plivesey.github.io/bs/.

## Running the Command Line tool

You need `node` to run the tool. If you don't have `node`, you can install it with `npm`:

```
$ npm install -g node
```

You should start with:

```
$ cd cl
$ node ./bs.js -h
```

This should give you information on how to run various commands.

## Contributing

To add your own strategies:

1. Check out the files `playFunctions.js` and `callFuncitons.js`. There are several classes here which you can copy for your own strategies.
2. You can implement two functions for playing and calling. The first returns what you are playing or what you are calling depending on a certain state. You can see all the properties of the state in `game.js`. The other is a summary function which is called after each turn. You can use this to update internal metrics on how the game is going.
3. In `bs.js`, add your new class to `playingStrategies` AND `orderedPlayingStrategies` or `callingStrategies` AND `orderedCallingStrategies`.
4. Run `$ node ./bs.js YOUR_STRATEGY` and see how it does!

## Feel free to contact me!

These instructions aren't very complete. Please file an issue or email me if you have any questions on contributing or running the app.