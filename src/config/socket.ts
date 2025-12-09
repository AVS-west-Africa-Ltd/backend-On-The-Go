import { Server, Socket } from "socket.io";
import chat from "../services/chat.service";
import socketAuth from "../middlewares/socket";


export const setupSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuth);

  const services: Array<(io: Server, socket: Socket) => void> = [chat];

  io.on("connection", (socket: Socket) => {
    console.log("SOCKET_CONNECTED:", socket.id);

    // Initialize all socket services
    services.forEach((service) => service(io, socket));

    socket.on("disconnect", () => {
      console.log("SOCKET_DISCONNECTED:", socket.id);
    });
  });

  return io;
};

export default setupSocket;
