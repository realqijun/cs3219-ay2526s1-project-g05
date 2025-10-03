import { ApiError } from "../errors/ApiError.js";

export class MatchingService {
    constructor({ repository }) {
        this.repository = repository;
        this.pendingMatches = {};
    }
    
    async exitQueue(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to exit the queue.");
        }
        if (!this.repository.sessionInQueue(sessionId)) {
            throw new ApiError(404, "Session ID not found in queue.");
        }
        const result = await this.repository.removeFromQueue(sessionId);
        return result;
    }

    async enterQueue(user, criteria) {
        if (!user || !criteria) {
            throw new ApiError(400, "User and criteria are required to enter the queue.");
        }
        if (this.repository.userInQueue(user)) {
            throw new ApiError(400, "User is already in the queue.");
        }
        // TODO: check users in pending matches

        const matchedUser = await this.repository.dequeueAndLockUser(criteria);
        const sessionId = this.createSessionId(user);
        if (!matchedUser) {
            await this.repository.enterQueue(user, sessionId, criteria);
            return sessionId;
        }

        // TODO: query collab service and question service
        const matchData = {
            // collabId
            // questionId
            criteria: criteria
        }

        this.pendingMatches[matchedUser.sessionId] = { 
            ...matchData, 
            partner: user,
            partnerSessionId: sessionId 
        };

        this.pendingMatches[sessionId] = { 
            ...matchData, 
            partner: matchedUser.user, 
            partnerSessionId: matchedUser.sessionId
        };

        return sessionId;
    }

    checkPendingMatch(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to check for pending matches.");
        }
        const data = this.pendingMatches[sessionId];
        if (data) {
            delete this.pendingMatches[sessionId];
        }
        return data;
    }

    async sessionInQueue(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to check queue status.");
        }
        return this.repository.sessionInQueue(sessionId);
    }

    async removeFromQueue(user) {
        if (!user) {
            throw new ApiError(400, "User is required to remove from the queue.");
        }
        const result = await this.repository.removeFromQueue(user);
        return result;
    }
    // TODO: clean up queue after closing
    
    // simple session id generator
    // TODO: change to be more complex and not guessable and constant size?
    createSessionId(user) {
        return `session-${user.id}-${Date.now()}`;
    }
}