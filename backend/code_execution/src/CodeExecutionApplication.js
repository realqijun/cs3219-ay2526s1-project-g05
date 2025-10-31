import express from "express";
import cors from "cors";
import { runCodeHandler } from "./execution_controller.js";

export class CodeExecutionApplication {
    constructor({ port = process.env.CODEEXECUTIONPORT || 4005 } = {}) {
        this.port = port;
        this.app = null;
    }

    async init() {
        if (this.app) {
            return this.app;
        }
        const app = express();
        app.enable("trust proxy");
        app.use(express.json());
        if (process.env.NODE_ENV === "development") {
            app.use(cors());
        }
        app.post('/api/run', runCodeHandler);
        app.get('/', (req, res) => {
            res.send({ status: 'Code Runner Service is Operational' });
        });
        this.app = app;
        return this.app;
    }

    async start() {
        const app = await this.init();
        return new Promise((resolve) => {
            this.server = app.listen(this.port, () => {
                console.log(`Code Execution service listening on port ${this.port}`);
                resolve(this.server);
            });
        });
    }
}
