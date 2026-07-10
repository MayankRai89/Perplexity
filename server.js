import "dotenv/config";
import app from "./src/app.js";
import connectDb from "./src/config/database.js";

const PORT = process.env.PORT || 3000;
connectDb().catch((err) => {
  console.error("MOngoDB connection failed:", err);
  process.exit(1);
});
app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
