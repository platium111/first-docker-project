const express = require("express");
const mongoose = require("mongoose");
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
} = require("./config/config");

const app = express();

mongoose
  .connect(
    `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`
  )
  .then(() => console.log("Succesful connected to Mongo"))
  .catch((e) => console.log(e)); // 27017 is default mongo port

app.get("/", (req, res) => {
  res.send("<h1> Hello devops hhh</h1>");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
