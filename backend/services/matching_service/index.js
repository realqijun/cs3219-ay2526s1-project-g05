import { MatchingApplication } from './src/MatchingApplication.js';
import { MongoClientInstance } from '../../common_scripts/mongo.js';

const port = process.env.MATCHINGSERVICEPORT || 4003;
const matchingApp = new MatchingApplication({ port });

let service;

const start = async () => {
    try {
        service = await matchingApp.start();
    } catch (error) {
        console.error('Failed to start matching service:', error);
        process.exit(1);
    }
};

start();

const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    if (service) {
        await new Promise((resolve) => service.close(resolve));
    }
    // await MongoClientInstance.close();
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));