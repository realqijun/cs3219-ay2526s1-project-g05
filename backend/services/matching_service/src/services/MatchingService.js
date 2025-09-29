import { ApiError } from "../errors/ApiError.js";

export class MatchingService {
    constructor({ repository }) {
        this.repository = repository;
    }
    
    async findMatch(user, criteria) {
        if (!user || !criteria) {
            throw new ApiError(400, "User and criteria are required to find a match.");
        }

        const result = await this.repository.find_match(user, criteria);
        return result;
    }

    async cancelMatch(user) {
        if (!user) {
            throw new ApiError(400, "User is required to cancel a match.");
        }
        
        const result = await this.repository.cancel_match(user);
        return result;
    }

    // TODO: clean up queue after closing
    
}