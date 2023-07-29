const socket = io.connect();

const guessInput = document.getElementById('guess-input');
const characterDisplay = document.getElementById('character-display');
const statusDisplay = document.getElementById('status-display');
const incorrectGuessDisplay = document.getElementById('incorrect-guess-display');
const categoryDisplay = document.getElementById('category-display');
const sendGuessButton = document.getElementById('send-guess');

guessInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    sendGuessButton.click();
  }
});

sendGuessButton.addEventListener('click', () => {
  if (guessInput.value.length === 0) {
    statusDisplay.innerText = '';
    incorrectGuessDisplay.innerText = '';
    sendGuessButton.innerText = 'Submit Guess';
  }

  socket.emit('send-guess', guessInput.value);
  guessInput.value = '';
});

socket.on('update-character', (data) => {
  characterDisplay.innerText = data;
});

socket.on('game-over', (data) => {
  if (data.result === 'win') {
    statusDisplay.innerText = 'You won!';
    sendGuessButton.innerText = 'New Game';
  } else if (data.result === 'lose') {
    statusDisplay.innerText = 'You lost!';
    sendGuessButton.innerText = 'New Game';
  }
});

socket.on('incorrect-guess', (data) => {
  incorrectGuessDisplay.innerText += data + ', ';
});

socket.on('category', (data) => {
  categoryDisplay.innerText = 'Category: ' + data;
});

setInterval(() => {
  if (guessInput.value.length === 0) {
    sendGuessButton.innerText = 'New Game';
  } else {
    sendGuessButton.innerText = 'Submit Guess';
  }
}, 50);
