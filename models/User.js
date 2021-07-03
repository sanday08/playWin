const mongoose = require("mongoose");
// const crypto = require("crypto");
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
const UserSchema = new mongoose.Schema({

  referralId: {
    type: String,
    default: '',
  },
  mobile: {
    type: String,
    unique: [true, "Your Account allready available"],
    maxlength: [10, "Phone number can not be longer than 10 characters"],
    required: true,
  },
  role: {
    type: String,
    enum: ["User", "Admin"], //if you write admin than its display error "`admin` is not a valid enum value for path `role`".
    default: "User",
  },
  nickName: String,
  password: {
    type: Number,
    required: [true, "Please add a password"],
    minlength: [6, "Password must be at least 6 characters"],
    maxlength: [6, "password must be at least 6 characters"],
    select: false,
  },
  amount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });
//Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role, nickName: this.nickName, referralId: this.referralId, mobile: this.mobile, amount: this.amount }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
module.exports = mongoose.model("User", UserSchema);
