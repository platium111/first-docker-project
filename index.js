const express = require("express");
const mongoose = require("mongoose");
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");
const postRouter = require("./routes/postRoute");
const userRouter = require("./routes/userRoute");

// session with redis
const redis = require("redis");
const session = require("express-session");
let RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
  url: "redis://redis:6379", // refer to Redis server
});

const app = express();

const connectWithRetry = () => {
  mongoose
    .connect(
      `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      }
    )
    .then(() => console.log("Succesful connected to Mongo"))
    .catch((e) => {
      console.log(e);
      setTimeout(connectWithRetry, 5000);
    }); // 27017 is default mongo port
};

connectWithRetry();

app.use(
  session({
    name: "session_name",
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30000,
      httpOnly: false,
      secure: false,
    },
  })
);
// Route
app.use(express.json()); // if don't have, we can use post method because body is not parsing
app.get("/api/v1", (req, res) => {
  res.send("<h1> Hello devops hhh</h1>");
});

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

// listen port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
