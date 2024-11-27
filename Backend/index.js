import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";

import userRoute from "./routes/user.route.js";
import messageRoute from "./routes/message.route.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const allowedOrigins = [
  "https://chatapp-client-rouge.vercel.app"

];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin)) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error("Not allowed by CORS")); // Reject the request
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// Real-time message handling
const users = {};

const getReceiverSocketId = (receiverId) => {
  return users[receiverId];
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    users[userId] = socket.id;
    console.log("Online users:", users);
  }

  io.emit("getOnlineUsers", Object.keys(users));

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    delete users[userId];
    io.emit("getOnlineUsers", Object.keys(users));
  });
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// MongoDB connection
const PORT = process.env.PORT || 3001;
const URI = process.env.MONGODB_URI;

try {
  mongoose.connect(URI);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Error connecting to MongoDB:", error);
}

// Routes
app.use("/api/user", userRoute);
app.use("/api/message", messageRoute);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
