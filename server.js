// server.js - Main Express Server
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const houseRoutes = require("./routes/houses");
const authRoutes = require("./routes/auth");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json());

app.use("/api/houses", houseRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Real Estate API is running");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
