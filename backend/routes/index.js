const express = require("express");
const userRoutes = require("./user"); // Import user routes

const router = express.Router();

router.use("/user", userRoutes);

module.exports = router;
