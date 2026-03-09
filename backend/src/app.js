const express = require("express");
const cors = require("cors");
const menuRoutes = require("./routes/menu.routes");
const categoryRoutes = require("./routes/category.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", menuRoutes);
app.use("/api", categoryRoutes);

module.exports = app;