import app from "@/src/app";
import configs from "@/src/config";

function run() {
  app.listen(configs.port, () => {
    console.log(`User service running on http://localhost:${configs.port}`);
  });
}

run();