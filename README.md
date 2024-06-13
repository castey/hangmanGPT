# Hangman Game with OpenAI and Socket.IO
## Overview
This is a simple, interactive hangman game that uses the OpenAI API to generate phrases for the user to guess. The game is served over an Express server and uses Socket.IO for real-time, bidirectional and event-based communication.

The game can be played directly in the browser. The user guesses the letters or the entire phrase, and the game provides real-time feedback about the guesses.

## Features
-Random phrase generation for each new game using GPT-3

-Dynamic interface that updates the game status in real-time

-Single letter or complete phrase guessing

-Indication of game status and end of game

## Installation
To get started, clone the repository and install the dependencies.

`git clone https://github.com/castey/hangmanGPT.git`

`cd hangmanGPT`

`npm install`

Create a .env file in the root directory and add your OpenAI API key.

`API_KEY=your_openai_api_key`

## Usage
To start the server, run:

`npm start`
The server runs on port 3000 by default (or any port specified in your environment variables). You can then open http://localhost:3000 in your browser to start playing the game.

You can start a new game or make a guess by typing into the input field and pressing Enter or clicking on the Submit Guess/New Game button. If the input field is empty and you press Enter or click the button, a new game will start. If you've typed something into the field, it will be submitted as a guess.

## Game Rules
Randomly selects a phrase related to a certain category.
A new game can be started at any time
The player can guess one letter at a time, or attempt to guess the entire phrase.
Keeps track of incorrect guesses and displays them to the player.
Game ends if the player successfully guesses the phrase, or if the player makes seven incorrect guesses.

## Dependencies
-Express

-socket.io

-dotenv

-openai

## License
Idk I'm not a lawyer but like you can use it. Just give credit because that's nice, please 🥹.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Authors and acknowledgment
Made by castey as a simple demonstration of working with the OpenAI AP and Socket.io.
