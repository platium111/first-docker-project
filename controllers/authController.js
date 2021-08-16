const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

exports.signUp = async (req, res) => {
  const { username, password } = req.body;
  const hashpassword = await bcrypt.hash(password, 12);
  try {
    const newUSer = await User.create({
      username,
      password: hashpassword,
    });
    req.session.user = newUSer;
    res.status(201).json({
      status: "success",
      data: {
        user: newUSer,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "fail",
    });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({
      username,
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "user not found",
      });
    }

    const isCorrect = await bcrypt.compare(password, user.password);
    if (isCorrect) {
      req.session.user = user; // need to set session here to check after in create post. If expired, then protect
      res.status(200).json({
        status: "success",
      });
    } else {
      res.status(400).json({
        status: "fail",
        message: "incorrect username or password",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "fail",
    });
  }
};
