const express = require('express');

const { Kafka, Partitioners } = require('kafkajs');

const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));


const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092', 'localhost:9090'],
  createPartitioner: Partitioners.LegacyPartitioner,
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'my-group' });

// Initial results
const candidates = ['Candidate A', 'Candidate B', 'Candidate C', 'Candidate D'];
let currentResults = candidates.reduce((acc, candidate) => ({ ...acc, [candidate]: 0 }), {});
console.log(currentResults)
// Handle socket.io connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Send initial votes to the client
  io.emit('updateVotes', currentResults);

  // Handle vote events from clients
  socket.on('vote', async (candidate) => {

    console.log('Sending message: ' + candidate)
    await producer.connect();
    await producer.send({
      topic: 'votes-topic',
      messages: [{ value: candidate }],
    });

    await producer.disconnect();
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const handleVotes = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'votes-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const vote = message.value.toString();
      console.log('Received vote:', vote);
      currentResults = { ...currentResults, [vote]: currentResults[vote] + 1 };
      io.emit('updateVotes', currentResults);
    },
  });
};

handleVotes();


// Start the server
const PORT = process.env.PORT || 2222;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});