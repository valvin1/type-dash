const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected!');
    socket.emit('joinRoom', 'testroom');
    
    setTimeout(() => {
        console.log('Sending bad payload...');
        socket.emit('updateProgress', null);
    }, 500);
});

socket.on('disconnect', () => {
    console.log('Disconnected.');
});
