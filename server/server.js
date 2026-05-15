require("dotenv").config();
const path = require("path");
const express = require("express");
const app = require("./app");

const PORT = process.env.PORT || 5001;

// Serve React build (client/dist)
const __dirnameRoot = path.resolve();
app.use(express.static(path.join(__dirnameRoot, "client", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirnameRoot, "client", "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(
    `Ayyappa Tours API + Frontend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`
  );
});
