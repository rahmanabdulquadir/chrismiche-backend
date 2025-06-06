import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    console.log('MONGO URI:', process.env.DATABASE_URL);
     app.listen(config.port, () => {
      console.log(`Chrismiche is litening from port ${config.port || 7002}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
