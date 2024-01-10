// dependencies
require('dotenv').config();
const myKey = process.env.API_KEY;
const express = require('express');
const http = require('http');
const socketIo = require('socket.io')
const { Configuration, OpenAIApi } = require("openai");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const fs = require('fs');

// create OpenAI configuration
const configuration = new Configuration({
    apiKey: myKey,
});
const openai = new OpenAIApi(configuration);

// function to prompt OpenAI
async function simpleBot(prompt, tokens, temperature) {

    promptArray = [{ role: "system", content: "follow the instruction" },
    { role: "user", content: prompt }]

    const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: promptArray,
        max_tokens: tokens,
        temperature: temperature,
    });


    return response.data.choices[0].message.content;

}

// serve public folder
app.use(express.static('public'));

// parse json requests
app.use(express.json());

// read categories from file
const categories = fs.readFileSync("./categories.txt", 'utf8').split(',');

// pick the character to hide unguessed letters
const rChar = "-"

// on user connection
io.on('connection', (socket) => {

    // send reset event
    socket.emit('reset-state');

    // game state variables
    let hangmanStarted = false;
    let wrongLetters = [];
    let guessedLetters = [];
    let hangPhrase = '';
    let hangBlank = '';
    let category = '';

    console.log(`user ${socket.id} connected`);

    // handle user input
    socket.on('send-guess', (userGuess) => {

        // trim user input and format to lower case
        userGuess = userGuess.toLowerCase().trim();

        //start a new game if user enters nothing
        if (userGuess.length == 0) {

            // reset game state
            hangmanStarted = false;
            wrongLetters = [];
            guessedLetters = [];
            hangPhrase = '';
            hangBlank = '';
            category = '';

            // pick a random category
            category = categories[Math.floor(Math.random() * categories.length)];

            // generate phrase using OpenAI
            newWord(`Generate a moderately challenging realistic phrase for a game of Hangman, using words in the category '${category}'. The phrase should be composed of valid English words, separated by spaces and must be a real phrase known by a group of people. No nonsense phrases. For instance, if the category was 'music', a suitable output might be 'JAZZ QUARTET PERFORMANCE'`, 180, 0.96).then((ret) => {
                if (!ret) console.log("OpenAI error!");

                // format the phrase to lowercase, replace non letters and duplicate/trailing spaces
                hangPhrase = ret.toLowerCase().replace(/[^a-z ]+| {2,}/g, " ").trim();

                // replace all letters in the phrase to the hidden character to generate clue
                hangBlank = hangPhrase.replace(/[^ ]/g, rChar);

                // in case you want to keep track of words/phrases
                console.log(hangPhrase);

                // send clue and category to client
                socket.emit('update-character', hangBlank);
                socket.emit('category', category);

            }).catch((err) => {
                console.error(err);
            });

        }

        //handle single letter guesses
        else if (userGuess.length == 1) {

            //check if the guess is repeated
            if (guessedLetters.includes(userGuess) || wrongLetters.includes(userGuess)) {
                // Emit a general repeated-guess event


                // Check which array the guess is included in and handle accordingly
                if (guessedLetters.includes(userGuess)) {
                    socket.emit('repeated-guess', 'correctly');
                }

                if (wrongLetters.includes(userGuess)) {
                    socket.emit('repeated-guess', 'incorrectly');
                }
            }

            //if user guesses a letter correctly and letter has not been guessed
            else if (hangPhrase.includes(userGuess)) {

                //add letter to guessed letters array
                guessedLetters.push(userGuess);

                //replace the displayed word with the guesses filled in
                hangBlank = hangPhrase.replace(new RegExp(`[^ ${guessedLetters.join('')}]`, 'g'), rChar);

                socket.emit('update-character', hangBlank);
            }
            //if user guesses a letter incorrectly
            else {

                // add guess to list of wrong letters guessed
                wrongLetters.push(userGuess);
                socket.emit('incorrect-guess', userGuess);

                // Check if user has guessed wrong 7 times
                if (wrongLetters.length >= 7) {

                    // send loss event
                    socket.emit('game-over', 'lose');
                    hangPhrase = '';

                }
            }
        }

        // handle full phrase gueses
        else if (userGuess.length > 1) {

            // check if guess matches the phrase
            if (userGuess.toLowerCase() === hangPhrase) {

                // fill in clue
                hangBlank = hangPhrase;

                // Emit the updated hangBlank.
                socket.emit('update-character', hangBlank);

                // Emit another event here to indicate that the game has ended.
                socket.emit('game-over', 'win');

                hangPhrase = '';

            } else {
                // If guess is incorrect, you might want to emit an event.
                socket.emit('incorrect-word-guess', userGuess);
            }
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(`user ${socket.id} disconnected! ${reason}`);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});