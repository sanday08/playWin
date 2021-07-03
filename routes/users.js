const express = require("express");

const {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users");
const advancedResults = require("../middleware/advancedResults");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");


const router = express.Router();

//use middleware to protect, authorize
router.use(protect);
router.use(authorize("Admin"));
router.route("/").get(advancedResults(User), getUsers).post(createUser);

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);
module.exports = router;
