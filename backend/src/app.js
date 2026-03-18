const express = require("express");
const cors = require("cors");
const menuRoutes = require("./routes/menu.routes");
const categoryRoutes = require("./routes/category.routes");
const menuTypeRoutes = require("./routes/menu_type.routes");
const cartRoutes = require("./routes/cart.routes");
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/menu", menuRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/menu-type", menuTypeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

module.exports = app;