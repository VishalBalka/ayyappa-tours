const bcrypt = require("bcryptjs");
const password = process.argv[2];

if (!password) {
  console.log("Usage: node hash.js yourpassword");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log("\nHash:\n" + hash);
  console.log(
    "\nRun this in pgAdmin:\n" +
    "INSERT INTO admins (username, password_hash, email) VALUES " +
    "('admin', '" + hash + "', 'your@email.com');"
  );
});
