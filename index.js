const express = require("express");
const mongoose = require("mongoose");
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
} = require("./config/config");

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
app.get("/", (req, res) => {
  res.send("<h1> Hello devops hhh</h1>");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
