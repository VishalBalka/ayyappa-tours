require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Ayyappa Tours API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});