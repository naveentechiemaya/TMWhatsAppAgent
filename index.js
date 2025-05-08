const { Client, LocalAuth,  MessageMedia } = require("whatsapp-web.js");
//axios
const axios = require("axios");

const qrcode = require("qrcode-terminal");

const express = require('express');
const http = require('http');

const path = require('path');
const cors = require('cors');  // <-- Ensure CORS package is imported
const socketIo = require('socket.io');

const fs = require('fs');


const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

const app = express();
const server = http.createServer(app);

// Enable CORS for express API
app.use(cors({
  origin: 'http://localhost:3001',  // React frontend (ensure this is correct)
  methods: ['GET', 'POST'],
  credentials: true  // Allow cookies and credentials
}));

// Create Socket.IO server with CORS options
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001',  // React frontend (ensure this is correct)
    methods: ['GET', 'POST'],
    credentials: true  // Allow credentials (cookies, headers)
  }
});

client.initialize();

app.use(express.json());

// Multipart form with 'number', 'name', 'customMessage', and 'file'
app.post('/send', upload.single('file'), async (req, res) => {
  const { number, name, customMessage } = req.body;
  const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;

  const thankYouMessage = 
    `Dear ${name || 'Valued Contact'},\n\n` +
    `${customMessage || 'Thank you for your time and support. Please find the attached document.'}\n\n` +
    `Best regards,\nSandy`;

  try {
    // Send the text message
    const sentMsg = await client.sendMessage(formattedNumber, thankYouMessage);

    // Send static file (e.g., thank_you.pdf in 'public' folder)
    const staticFilePath = path.join(__dirname, 'public', 'ThankYou.pdf');

    if (fs.existsSync(staticFilePath)) {
      const media = MessageMedia.fromFilePath(staticFilePath);
      await client.sendMessage(formattedNumber, media);
    } else {
      return res.status(404).json({ status: 'error', error: 'Static file not found.' });
    }

    res.status(200).json({ status: 'sent', messageId: sentMsg.id.id });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Serve frontend QR UI (optional)
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('Socket client connected');
});

// Start the server
server.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});

