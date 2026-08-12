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

// =====================================================
// PORT
//
// Local development:
// PORT is usually not defined, so we use 3000.
//
// Render:
// Render automatically provides PORT.
// =====================================================

const port = process.env.PORT || 3000;

// =====================================================
// CORS
//
// Local frontend:
// http://localhost:5173
//
// Production frontend:
// FRONTEND_URL will contain the Vercel URL.
// =====================================================

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Postman/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },

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
    res.status(200).send(
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
  "0.0.0.0",
  () => {
    console.log(
      `ResolveIQ server running on port ${port}`
    );
  }
);