const bcrypt = require("bcryptjs");

const defaultPassword = "admin123";

(async () => {
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  console.log("Generated hash:", passwordHash);

  const isMatch = await bcrypt.compare("admin123", passwordHash);

    console.log("Password match:", isMatch);
})();
