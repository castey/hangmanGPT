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

// create OpenAI configuration
const configuration = new Configuration({
    apiKey: myKey,
});
const openai = new OpenAIApi(configuration);

// function to prompt OpenAI
async function newWord(prompt) {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 200,
        temperature: 1,
    });
    return response.data.choices[0].text;
}

// serve public folder
app.use(express.static('public'));

// parse json requests
app.use(express.json());

// delcare categories array
const categories = [
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
    "Architectural Styles", "Cryptography", "Fossils", "Types of Ships", "Constellations", "Types of Fabric", "Periodic Table Elements", "Famous Explorers",
    "Digital Art", "Dance Moves", "Medieval History", "Famous Writers", "Renowned Composers", "Foreign Languages", "Comic Book Heroes", "Gardening Techniques",
    "Famous Athletes", "Traditional Dishes", "Spectator Sports", "Movie Genres", "Photography Techniques", "Physics Terms", "Climate Zones", "World Currencies",
    "Exotic Animals", "Historic Events", "Classic Video Games", "Martial Arts", "Contemporary Artists", "Botanical Terms", "Astronomical Objects", "Folklore Creatures",
    "Types of Coffee", "Quantum Physics", "TV Series", "Conspiracy Theories", "Prehistoric Animals", "Psychological Concepts", "Yoga Poses", "Computer Languages",
    "Human Rights", "Jazz Musicians", "Greek Gods", "Famous Poets", "Biology Terms", "Environmental Issues", "Major Wars", "Ancient Myths",
    "Rare Diseases", "Asian Cuisine", "World Cuisine", "Opera Works", "Scientific Laws", "Television Sitcoms", "Political Ideologies", "Rock Bands",
    "Classic Board Games", "Stand-Up Comedians", "Gourmet Foods", "Desert Creatures", "Famous Trains", "Largest Cities", "Computer Viruses", "Famous Volcanoes",
    "Spices and Herbs", "Software Programs", "Pioneering Inventors", "Celebrated Novels", "Computer Science Terms", "Organic Chemistry", "Painting Techniques", "Symphony Orchestras",
    "Minerals and Rocks", "Historic Journeys", "Olympic Sports", "World Landmarks", "Renowned Sculptures", "Wonders of the World", "Endangered Species", "World Rivers",
    "Types of Aircraft", "Baroque Music", "Religious Texts", "Dog Breeds", "Anime Characters", "Ski Resorts", "World Deserts", "Fitness Exercises",
    "Roman Emperors", "Space Missions", "African Countries", "Notable Speeches", "Ancient Artifacts", "Types of Tea", "Classic Toys", "Physics Discoveries",
    "Jazz Standards", "Tropical Fruits", "Types of Birds", "Natural Disasters", "Music Festivals", "Astronomy Discoveries", "Types of Dinosaurs", "Art Techniques",
    "Space Stations", "Famous Philosophers", "Crypto Currencies", "Fantasy Novels", "Opera Singers", "Medicinal Plants", "National Parks", "Inventors and Inventions",
    "Classical Ballets", "Symptoms and Diseases", "Aviation History", "Robotics", "The Human Genome", "Chemical Reactions", "Famous Archaeological Sites", "Historical Empires",
    "Jazz Albums", "Grammy Winners", "Oceanography", "Paleontology", "Mountain Ranges", "Coral Reefs", "Wine Varieties", "Exploration Expeditions", "Coding Algorithms", "Space Telescopes",
    "Quantum Mechanics", "World Leaders in History", "Celebrity Chefs", "Oscar-Winning Films", "Famous Economists", "Renewable Energy", "Mythical Artifacts", "Galaxies and Nebulas",
    "Types of Poetry", "Scientific Revolutions", "Physics Nobel Laureates", "Types of Clouds", "Shakespeare's Plays", "Animal Behavior", "Children's TV Shows", "Artistic Techniques",
    "World Lakes", "Fitness Equipment", "DNA and Genomics", "Human Evolution", "World Festivals", "Satellites and Probes", "Legendary Creatures", "Herbs and Medicinal Plants",
    "Nutrition and Diet", "Meditation Techniques", "Cybersecurity", "Deep Sea Creatures", "The Solar System", "International Cuisine", "Music Composition", "Particle Physics",
    "Archaeological Discoveries", "Data Science", "Epic Poems", "Psychological Disorders", "Prime Numbers", "Vintage Movies", "Spacecraft and Rockets", "Art Exhibitions",
    "Baking Techniques", "Famous Speeches", "Radio Shows", "Famous Serial Killers", "World Oceans", "Nuclear Physics", "Classical Mythology", "Book Genres",
    "Wildlife Conservation", "Biochemistry", "Pop Music History", "Radioactive Elements", "Thermal Physics", "Weather Forecasting", "Molecular Biology", "Types of Mountains",
    "American History", "Bollywood Movies", "Famous Inventors", "Historical Mysteries", "Medieval Architecture", "Legendary Sports Moments", "Natural Wonders", "Wildlife Photography",
    "Superheroes and Villains", "Tropical Islands", "Video Game History", "Computer Network", "Modern Art Movements", "Sustainable Practices", "Life in the Universe", "Ancient Wonders",
    "Cycling Events", "Modern History", "Wonders of Nature", "The Animal Kingdom", "Renowned Authors", "Classic Literature", "Wild West", "Breakthrough Technologies",
    "Latin American History", "Concert Halls", "Physics Concepts", "Famous Landmarks", "Great Composers", "Human Anatomy", "Viral Internet Memes", "Space Agencies",
    "Arctic Animals", "Religious Symbols", "Famous Inventors", "Preserved Monuments", "Periods of Art", "Artistic Movements", "Famous Museums", "Tennis Players",
    "Spacecrafts", "Modern Dance", "Opera Houses", "Deserts of the World", "Famous Rivers", "Ocean Creatures", "Musical Terms", "Mathematical Concepts",
    "Prehistoric Periods", "Automobile History", "World Wars", "Historical Weapons", "Horror Movies", "Marine Biology", "Bestselling Novels", "Classic Operas",
    "Bird Species", "Famous Mathematicians", "Geological Periods", "World's Tallest Buildings", "Currencies of the World", "Marine Life", "Musical Compositions", "Greek Mythology"
];


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
            newWord(`Generate a challenging yet realistic phrase for a game of Hangman, using words related to the category '${category}'. The phrase should be composed of valid English words, separated by spaces. No nonsense words. For instance, if the category was 'music', a suitable output might be 'JAZZ QUARTET PERFORMANCE'`).then((ret) => {
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
                socket.emit('game-over', 'win' );
                
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