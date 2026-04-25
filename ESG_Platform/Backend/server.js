require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const routes = require("./routes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

const path = require("path"); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`, req.body);
  next();
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io available to routes
app.set('io', io);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`server running on port ${port}`);
});