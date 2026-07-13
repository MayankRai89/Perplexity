import "dotenv/config";
import app from "./src/app.js";
import connectDb from "./src/config/database.js";
import { testAImodel } from "./src/config/services/ai.sevice.js";

import { initSocket } from "./src/config/socket.js";

const PORT = process.env.PORT || 3000;
testAImodel();
connectDb().catch((err) => {
  console.error("MOngoDB connection failed:", err);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});

initSocket(server);
