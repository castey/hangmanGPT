// declare constants
const socket = io.connect();
const guessInput = document.getElementById('guess-input');
const characterDisplay = document.getElementById('character-display');
const statusDisplay = document.getElementById('status-display');
const incorrectGuessDisplay = document.getElementById('incorrect-guess-display');
const categoryDisplay = document.getElementById('category-display');
const sendGuessButton = document.getElementById('send-guess');
let gameInProgress = false;
let doubleCheck = false;

// detect enter key event
guessInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    sendGuessButton.click();
  }
});

// detect click event
sendGuessButton.addEventListener('click', () => {

  // handle empty inputs
  if (guessInput.value.length === 0) {

    // if game in progress and enter pressed once
    if (gameInProgress == true && doubleCheck == false) {
      doubleCheck = true;
      statusDisplay.innerText = "New game? Press enter again"
    }

    // if no game in progress or if ready for final enter
    else {
      statusDisplay.innerText = '';
      incorrectGuessDisplay.innerText = '';
      sendGuessButton.innerText = 'Submit Guess';
      doubleCheck = false;
      socket.emit('send-guess', '');
    }
  }

  // send guess if game in progress
  else if (gameInProgress == true){
    statusDisplay.innerText = '';
    doubleCheck = false;
    socket.emit('send-guess', guessInput.value);
  }

  // start new game if no game in progress
  else{
    socket.emit('send-guess', '');
  }
  guessInput.value = '';
});

// update the clue
socket.on('update-character', (data) => {
  characterDisplay.innerText = data;
});

// handle game over event
socket.on('game-over', (data) => {
  if (data.result === 'win') {
    statusDisplay.innerText = 'You won!';
    sendGuessButton.innerText = 'New Game';
  } else if (data.result === 'lose') {
    statusDisplay.innerText = 'You lost!';
    sendGuessButton.innerText = 'New Game';
  }
  gameInProgress = false;
  guessInput.style.display = 'none';
  guessInput.placeholder = "Press enter to start new";
});

// handle incorrect letter guesses
socket.on('incorrect-guess', (data) => {
  incorrectGuessDisplay.innerText += data + ', ';
});

// handle incorrect phrase guesses
socket.on('incorrect-word-guess', (data) => {
  statusDisplay.innerText = `Yayy!! ${data} is the corre... Just kidding it's WRONG!!`;
});

// display the category
socket.on('category', (data) => {
  categoryDisplay.innerText = 'Category: ' + data;
  guessInput.placeholder = "Guess a letter or phrase";
  gameInProgress = true;
  guessInput.style.display = 'inline-block';
});

// update the submit button
setInterval(() => {
  if (guessInput.value.length === 0) {
    sendGuessButton.innerText = 'New Game';
  } else {
    sendGuessButton.innerText = 'Submit Guess';
  }
}, 50);
