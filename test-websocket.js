import WebSocket from 'ws';

// Test WebSocket connection to the deployed app
const ws = new WebSocket('wss://sharein-469916.lm.r.appspot.com/signaling');

ws.on('open', function open() {
  console.log('WebSocket connection established');
  ws.send('Hello Server!');
});

ws.on('message', function incoming(data) {
  console.log('Received:', data);
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
});