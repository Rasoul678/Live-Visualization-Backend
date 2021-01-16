const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const socketio = require('socket.io');
const http = require('http');
const api = require('./router');
const fs = require('fs');
const readline = require('readline');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/api', api);

const convert = (file) => {

    return new Promise((resolve, reject) => {

        const stream = fs.createReadStream(__dirname +  `/public/${file}`);
        // Handle stream error (IE: file not found)
        stream.on('error', reject);

        const reader = readline.createInterface({
            input: stream
        });

        const array = [];

        reader.on('line', line => {
            array.push(line);
        });

        reader.on('close', () => resolve(array));
    });
}

io.on('connection', (client) => {
    client.emit('serverMessage', {message: "Socket IO is Up and Running 🎉", date: (new Date()).toDateString()});
    let timer;

    client.on('fetchData', (interval) => {
        timer = setInterval(() => {
            convert('traffic.txt')
            .then(text => {
                client.emit('receiveData', {text})
            })
            .catch(err => console.error(err));
        }, interval);
    });

    client.on('disconnect', () => {
        clearInterval(timer);
        console.log('disconnected');
    });
});

module.exports = server;