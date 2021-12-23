import { NextFunction } from "express";
import { NextServer } from "next/dist/server/next";
import { Server, Socket } from "socket.io";

// TODO create const file to implement paths
const io: Server = new Server({
  path: "/sockets",
  serveClient: false,
  // below are engine.IO options
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

io.use((socket: Socket, next) => {
  // TODO verify firebase token
  console.log("message from middleware");
  const token = socket.handshake.query.token;

  if (!token) {
    console.log("middleware error");
    const err: any = new Error("not authorized");
    err.data = { content: "Please retry later" }; // additional details
    next(new Error("Unauthorized"));
  }

  next();
});

io.on("connection", (socket: Socket) => {
  console.log("a user connected to socket by socketId=" + socket.id);

  // TODO create an type of the variable for member of a room {socketId, firebaseToken}
  let currentMembers: object;

  // TODO join the room
  socket.on("join", (data) => {
    console.log("join the room", data.room);

    // TODO notify users who are login
    // TODO send status of whether the user can join at the room
    io.emit("result_join", { room: data.room, status: true });
  });

  // TODO send a message

  // TODO leave the room
});

export { io };
