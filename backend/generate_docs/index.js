// Script to retrieve the OpenAPI specs from various services
import dotenv from "dotenv";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env") });
const execAsync = promisify(exec);

const servicePorts = {
  user_service: process.env.USERSERVICEPORT || 4001,
  question_service: process.env.QUESTIONSERVICEPORT || 4002,
  //matching_service: process.env.MATCHINGSERVICEPORT || 4003,
  collaboration_service: process.env.COLLABORATIONSERVICEPORT || 4004,
  code_execution_service: process.env.CODEEXECUTIONPORT || 4005,
};
const start = async () => {
  for (const service in servicePorts) {
    const port = servicePorts[service];

    const response = await fetch(`http://localhost:${port}/api-docs`);
    const data = await response.json();
    const file_name = `${service}_docs.json`;
    await fs.writeFile(file_name, JSON.stringify(data));

    const service_output = `../services/${service}/api_docs.html`;
    const { _error, stdout, stderr } = await execAsync(
      `npx @redocly/cli@latest build-docs ${file_name} -o ${service_output}`,
    );
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);

    // Clean up JSON file
    await fs.unlink(file_name);

    console.log(`API Docs for ${service} written successfully.`);
  }
};

start();
