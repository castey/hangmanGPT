require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Configuration, OpenAIApi } = require("openai");
const myKey = process.env.API_KEY;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const configuration = new Configuration({
    apiKey: myKey,
});
const openai = new OpenAIApi(configuration);

async function newWord(prompt) {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 200,
        temperature: 1,
    });

    return response.data.choices[0].text;
}

app.use(express.static('public'));
app.use(express.json());

let categories = [
    "Before and After", "Song Lyrics", "On the Map", "Living Things", "What Are You Doing?", "Food & Drink", "Same Letter", "Rhyme Time",
    "Historical Events", "Famous People", "Science Terms", "Literary Characters", "Movie Titles", "Sports Teams", "City Landmarks", "Popular TV Shows",
    "Musical Instruments", "Famous Quotes", "Geographical Features", "Historical Figures", "Technology Innovations", "Classic Novels", "Art Movements", "Mythical Creatures",
    "Famous Battles", "Ancient Civilizations", "Children's Books", "Fairy Tales", "Modern Gadgets", "Space Exploration", "Famous Buildings", "In the Ocean",
    "Cultural Festivals", "Popular Websites", "Cartoon Characters", "Video Games", "In the Kitchen", "Car Brands", "Holiday Traditions", "Broadway Musicals",
    "In the Garden", "In the City", "At the Zoo", "Celebrity Gossip", "Fashion Trends", "World Leaders", "Historic Monuments", "Culinary Delights",
    "In the Sky", "Marvel Universe", "Sports Legends", "Film Genres", "Dance Styles", "Photography Terms", "Computer Programming", "Weather Phenomena",
    "Magical Items", "Poetic Forms", "Mathematical Terms", "Criminal Justice", "Famous Paintings", "World Religions", "Superstitions", "School Subjects",
    "Unsolved Mysteries", "Inventions", "Classic Cars", "Famous Buildings", "World Capitals", "Celestial Bodies", "Historic Sites", "Musical Genres",
    "Philosophical Concepts", "Internet Slang", "Board Games", "Music Theory", "Chemical Elements", "Flora and Fauna", "Clothing Brands", "Major Corporations",
    "Body Parts", "Kitchen Tools", "Video Game Characters", "Mythologies", "Military Vehicles", "Famous Scientists", "Historical Periods", "Astronauts",
    "Beverages", "Cooking Techniques", "Geometric Shapes", "Computer Parts", "Ecosystems", "Precious Gems", "Antiques", "Astronomy Terms",
    "Architectural Styles", "Cryptography", "Fossils", "Types of Ships", "Constellations", "Types of Fabric", "Periodic Table Elements", "Famous Explorers"
];

const rChar = "-"

io.on('connection', (socket) => {
    let hangmanStarted = false;
    let hangWord = '';
    let hangBlank = '';
    let wrongLetters = [];
    let guessedLetters = [];
    let category = '';

    socket.on('send-guess', (userGuess) => {

        userGuess = userGuess.toLowerCase().trim();
        //start a new game
        if (userGuess.length == 0) {
            hangmanStarted = true;
            category = categories[Math.floor(Math.random() * categories.length)];
            wrongLetters = [];
            guessedLetters = [];

            newWord(`Generate a challenging yet realistic phrase for a game of Hangman, using words related to the category '${category}'. The phrase should be composed of valid English words, separated by spaces. No nonsense words. For instance, if the category was 'music', a suitable output might be 'JAZZ QUARTET PERFORMANCE'`).then((ret) => {
                if (!ret) throw new Error("OpenAI error")

                hangWord = ret;
                hangWord = hangWord.replace(/[^a-zA-Z ]/g, "").toLowerCase().trim();
                hangBlank = hangWord.replace(/[^ ]/g, rChar);

                console.log(hangWord);

                socket.emit('update-character', hangBlank);
                socket.emit('category', category);

              }).catch((err) => {
                console.error(err);
              });

        }

        //handle single letter guesses
        else if (userGuess.length == 1) {

            //check if the guess is repeated
            if(guessedLetters.includes(userGuess.toLowerCase()) || wrongLetters.includes(userGuess.toLowerCase())) {
                socket.emit('repeated-guess', userGuess);
            }
            //if user guesses a letter correctly and letter has not been guessed
            else if(hangWord.includes(userGuess)){

                //add letter to guessed letters array
                guessedLetters.push(userGuess.toLowerCase());

                //remove dashes for every guessed letter
                let regexStr = `[^ ${guessedLetters.join('')}]`;
                let regex = new RegExp(regexStr, 'g');

                //replace the displayed word with the guesses filled in
                hangBlank = hangWord.replace(regex, rChar);

                socket.emit('update-character', hangBlank);
            } 
            //if user guesses a letter incorrectly
            else {
                wrongLetters.push(userGuess.toLowerCase());
                socket.emit('incorrect-guess', userGuess);

                // Check if user has guessed wrong 7 times
                if(wrongLetters.length >= 7) {
                    socket.emit('game-over', {result: 'lose'});
                    hangmanStarted = false; // Ensure the game is flagged as ended

                    // Reset game state
                    wrongLetters = [];
                    guessedLetters = [];
                    hangWord = '';
                    hangBlank = '';
                }
            }
        } 
        else if (userGuess.length > 1) {
            if (userGuess.toLowerCase() === hangWord) {
              hangmanStarted = false;

              wrongLetters = [];
              guessedLetters = [];

              hangBlank = hangWord; // The guess is correct so the blank will now be filled with the complete word.
              
              socket.emit('update-character', hangBlank); // Emit the updated hangBlank.

              // Emit another event here to indicate that the game has ended.
              socket.emit('game-over', {result: 'win'});

              // Reset game state
              wrongLetters = [];
              guessedLetters = [];
              hangWord = '';
              hangBlank = '';
            } else {
                // If guess is incorrect, you might want to emit an event.
                socket.emit('incorrect-word-guess', userGuess);
            }
        }
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});