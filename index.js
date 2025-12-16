import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";
import productRoutes from "./routes/products.js";
import userRoutes from "./routes/users.js";
import orderRoutes from "./routes/orders.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====== Middleware ======
app.use(
  cors({
    origin: [
      "http://localhost:5173",          // local dev (Vite)
      "http://localhost:3000",          // local dev (if CRA/Next)
      "https://client-repo.onrender.com" // Render frontend URL
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

// ====== Routes ======
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("✅ Garments Tracker Server is Running!");
});

// ====== Start server ======
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
