const express = require("express");
const cors = require("cors");

const app = express();

// Allow CORS requests from the frontend
app.use(cors({
  origin: "http://localhost:3000", // Frontend's address
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());

const eventRoutes = require("./routes/events");
app.use("/api/events", eventRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
