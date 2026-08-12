import connectDB from "./config/db.js";
import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import cors from "cors";

dotenv.config();

const app = express();

const port = 3000;

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// ROUTES
// =====================================================

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Tickets
app.use(
  "/api/tickets",
  ticketRoutes
);

// Ticket comments
app.use(
  "/api/tickets",
  commentRoutes
);

// Dashboard
app.use(
  "/api/dashboard",
  dashboardRoutes
);

// Admin
app.use(
  "/api/admin",
  adminRoutes
);

// =====================================================
// ROOT ROUTE
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.send(
      "ResolveIQ API is running!"
    );
  }
);

// =====================================================
// DATABASE + SERVER
// =====================================================

connectDB();

app.listen(
  port,
  () => {
    console.log(
      `ResolveIQ server running on http://localhost:${port}`
    );
  }
);