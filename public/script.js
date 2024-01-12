const socket = io();

// Update currentResults when received from the server
socket.on('updateVotes', (currentResults) => {
  document.getElementById('Candidate A').textContent = currentResults['Candidate A'];
  document.getElementById('Candidate B').textContent = currentResults['Candidate B'];
  document.getElementById('Candidate C').textContent = currentResults['Candidate C'];
  document.getElementById('Candidate D').textContent = currentResults['Candidate D'];
});

// Function to send a vote to the server
function vote(candidate) {
  socket.emit('vote', candidate);
}