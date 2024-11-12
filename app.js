import express from "express";
import mongoose from "mongoose";
import routes from "./routes/routes.js";
import cors from "cors";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/notFound.js";
import config from "./utils/config.js";
const app = express();

// declare server port
const port = process.env.PORT || 9000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// cors middleware
app.use(cors());
// bodypaser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// loger middleware
app.use(logger);
// use not fond
// app.use(notFound);
app.use("/api/v1", routes);
// connect to mongodb
mongoose
  .connect(config.LOCAL_DATABASE, {
    useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log(err));
app.listen(port, () => console.log(`Listening on port ${port}`));
