const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const mainRouter = require("./routes/index");
const cors = require("cors");

const app = express();

// Load environment variables
dotenv.config();

app.use(express.json());
app.use(cors());

app.use("/api/v1", mainRouter);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database is connected successfully!");
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1); // Stop the app if DB connection fails
  }
};

app.get("/", (req, res) => {
  res.json("Server is up and running");
});

// Start Server
const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is undefined
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server is running on port: ${PORT}`);
});
