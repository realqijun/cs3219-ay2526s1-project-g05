import { MongoClientInstance } from '../../common_scripts/mongo.js';
import { COLLECTIONS } from '../../db_management/schemas/index.js';

export async function setupUserCollection() {
    try {
        await MongoClientInstance.start();

        const db = MongoClientInstance.db;
        const userConfig = COLLECTIONS.users;

        // Create collection with schema validation
        try {
            await db.createCollection('users', {
                validator: userConfig.schema
            });
        } catch (error) {
            throw error;
        }

        return true;
    } catch (error) {
        return false;
    }
}