const { Server } =  require("socket.io");
const chat = require("../services/chat");
const SocketMiddleware = require("../middlewares/socket");

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
  });

  io.use(SocketMiddleware);

  const services = [chat];

  io.on("connection", (socket) => {
    console.log("SOCKET_CONNECTED", socket.id);
    
    services.forEach((service) => service(io, socket));

    socket.on("disconnect", () => {
      logEvent("SOCKET_DISCONNECTED", socket.id);
    });
  });

  return io;
};

module.exports = setupSocket;