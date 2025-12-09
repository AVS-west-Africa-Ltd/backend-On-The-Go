import { Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AuthenticatedSocket extends Socket {
  user?: any;    // You can replace `any` with your User type
  profile?: any; // Replace `any` with your Profile type
}

const socketAuth = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.toString().split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & {
      user?: any;
      profile?: any;
    };

    socket.user = decoded.user;
    socket.profile = decoded.profile;

    console.log(`🔐 Socket authenticated: ${socket.user?.id || "unknown user"}`);
    next();
  } catch (err: any) {
    console.error("❌ Socket auth error:", err.message);
    next(new Error("Authentication failed"));
  }
};

export default socketAuth;
