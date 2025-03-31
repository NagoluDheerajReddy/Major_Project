const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { authMiddleware } = require("../middleware");

const router = express.Router();

// USER SIGN UP Validation Schema
const signupBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

router.post("/signup", async (req, res) => {
  const { success } = signupBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({ message: "Incorrect inputs" });
  }

  const existingUser = await User.findOne({ username: req.body.username });

  if (existingUser) {
    return res.status(411).json({ message: "Email already taken" });
  }

  const { username, firstName, lastName, password } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const newUser = await User.create({ username, firstName, lastName, password: hashedPassword });
  const userId = newUser._id;

  // Create new account
  await Account.create({ userId, balance: parseInt(Math.random() * 10000) });

  // **✅ Fixed JWT Issue**
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT Secret is missing!" });
  }

  const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.status(200).json({ message: "User created successfully", token });
});

// USER SIGN IN Validation Schema
const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

router.post("/signin", async (req, res) => {
  const { success } = signinBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({ message: "Incorrect inputs" });
  }

  const user = await User.findOne({ username: req.body.username });

  if (!user) {
    return res.status(404).json("User not found!");
  }

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) {
    return res.status(401).json("Wrong credentials!");
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT Secret is missing!" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.status(200).json({ token });
});

// UPDATE USER INFO
const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({ message: "Error while updating information" });
  }

  await User.updateOne({ _id: req.userId }, req.body);

  res.json({ message: "Updated successfully" });
});

// GET USERS WITH FILTER QUERY
router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [{ firstName: { $regex: filter } }, { lastName: { $regex: filter } }],
  });

  res.json({ users });
});

// GET CURRENT USER INFO
router.get("/getUser", authMiddleware, async (req, res) => {
  const user = await User.findOne({ _id: req.userId });
  res.json(user);
});

module.exports = router;
