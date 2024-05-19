const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });
// Apply rate limiting to all requests
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
});

app.use(limiter);
// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const file = req.file;
    io.emit('file', {
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`
    });
    res.status(200).send('File uploaded.');
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
let users = 0;
// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected');
    users++;
    socket.emit("usrCount", users);
    socket.on('disconnect', () => {
        users--;
        socket.emit("usrCount", users);
        console.log('A user disconnected');
    });

    socket.on('message', (message) => {
        io.emit('message', message);
    });

    socket.on('image', (image) => {
        io.emit('image', image);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
