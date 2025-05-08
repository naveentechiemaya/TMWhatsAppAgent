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

// QR Code Generation
client.on('qr', async (qr) => {
  console.log('QR RECEIVED');
  const qrImage = await qrcode.toDataURL(qr);
  io.emit('qr', qrImage);  // Emit the QR to the frontend
});

// Ready to send messages
client.on('ready', () => {
  console.log('WhatsApp client is ready');
  io.emit('ready');  // Notify frontend that the client is ready
});

const app = express();
const server = http.createServer(app);

/// CORS config (customize for your frontend host if needed)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

client.initialize();

app.use(express.json());

app.get('/send', async (req, res) => {
  res.send(({
    message:"Hello World "
  }))
})
// Multipart form with 'number', 'name', 'customMessage', and 'file'
app.post('/send', async (req, res) => {
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
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
