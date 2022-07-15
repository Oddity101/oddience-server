const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const skillRoutes = require("./routes/skillRoutes");
const flutterwaveRoutes = require("./routes/flutterwaveRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paystackRoutes = require("./routes/paystackRoutes");
const webhooks = require("./routes/webhooks");
const errors = require("./middlewares/errors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/v1", authRoutes);
app.use("/api/v1", mentorRoutes);
app.use("/api/v1", skillRoutes);
app.use("/api/v1", flutterwaveRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1", paystackRoutes);
app.use("api/v1", webhooks);

app.use(errors);
module.exports = app;
