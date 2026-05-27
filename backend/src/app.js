const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const errorMiddleware = require("./middlewares/error.middleware");
const morgan = require("morgan");
const { register, metricsMiddleware } = require("./config/metrics");

const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const ticketRoutes = require("./modules/tickets/ticket.routes");
const messageRoutes = require("./modules/messages/message.routes");
const categoryRoutes = require("./modules/categories/category.routes");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://support-master.vercel.app",
  "https://localhost",
  "capacitor://localhost",
  "http://localhost",
];

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("combined"));
app.use(metricsMiddleware);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Trop de tentatives, réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/tickets/:ticketId/messages", messageRoutes);
app.use("/api/categories", categoryRoutes);

app.use(errorMiddleware);

module.exports = app;
