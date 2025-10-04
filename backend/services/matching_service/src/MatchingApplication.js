import express from 'express';
import { MongoClientInstance } from '../../../common_scripts/mongo.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { errorMiddleware, MatchingController } from './controllers/MatchingController.js';
import { createMatchingRouter } from './routes/matchingRoutes.js';
import { MatchingService } from './services/MatchingService.js';
import { MatchingRepository } from './repositories/MatchingRepository.js';

export class MatchingApplication {
    constructor({ port = process.env.MATCHINGSERVICEPORT || 4003 } = {}) {
        this.port = port;
        this.app = null;
    }

    async init() {
        if (this.app) {
            return this.app;
        }

        // await MongoClientInstance.start();
        const app = express();
        const repository = new MatchingRepository();
        const service = new MatchingService({ repository });
        const controller = new MatchingController(service);

        // Initialize repository (which handles Redis connection)
        await service.initialize();

        // set circular dependency
        await service.setNotifier(controller);
        
        app.enable('trust proxy');
        app.use(express.json());
        app.use(securityHeaders);

        app.get('/status', (_req, res) => {
            res.json({ status: 'Matching service is running' });
        });

        app.use("/api/matching", createMatchingRouter(controller));

        app.use(errorMiddleware);

        this.app = app;
        return this.app;
    }

    async start() {
        const app = await this.init();
        return new Promise((resolve) => {
            this.server = app.listen(this.port, () => {
                console.log(`Matching service listening on port ${this.port}`);
                resolve(this.server);
            });
        });
    }
}