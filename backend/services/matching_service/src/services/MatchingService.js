import { ApiError } from "../errors/ApiError.js";

export class MatchingService {
    constructor({ repository }) {
        this.repository = repository;
        // circular dependency on controller for notifying matches
        this.notifier = null;
    }

    async initialize() {
        await this.repository.initialize();
    }

    async setNotifier(controller) {
        this.notifier = controller;
    }

    async addActiveListener(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to add active listener.");
        }
        
        // Check for pending match using repository
        const pendingMatch = await this.repository.getPendingMatch(sessionId);
        if (pendingMatch) {
            return { notified: true, data: pendingMatch };
        }

        if (!(await this.repository.sessionInQueue(sessionId))) {
            throw new ApiError(404, "Session ID not found in queue.");
        }
        
        // Store active listener in Redis via repository
        await this.repository.addActiveListener(sessionId);
        
        return { notified: false };
    }

    async removeActiveListener(sessionId) {
        // Remove from Redis and queue via repository
        await this.repository.removeActiveListener(sessionId);
        await this.repository.removeFromQueue(sessionId);
        return true;
    }

    async clearFromQueue(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to clear from the queue.");
        }
        
        // Use repository's complete cleanup method
        const result = await this.repository.cleanupSession(sessionId);
        return result;
    }

    async enterQueue(user, criteria) {
        if (!user || !criteria) {
            throw new ApiError(400, "User and criteria are required to enter the queue.");
        }
        if (await this.repository.userInQueue(user)) {
            throw new ApiError(400, "User is already in the queue.");
        }

        const matchedUser = await this.repository.dequeueAndLockUser(criteria);
        const sessionId = this.createSessionId(user);
        
        if (!matchedUser) {
            await this.repository.enterQueue(user, sessionId, criteria);
            return sessionId;
        }

        const matchData = {
            // TODO: query collab service and question service
            criteria: criteria
        };

        // Check if matched user is actively listening via repository
        const isWaitingActive = await this.repository.isActiveListener(matchedUser.sessionId);
        
        const waitingPayload = { ...matchData, partner: user, partnerSessionId: sessionId };

        if (isWaitingActive) {
            this.notifier.notifyMatchFound(matchedUser.sessionId, waitingPayload);
            await this.repository.removeActiveListener(matchedUser.sessionId);
        } else {
            // Store pending match via repository
            await this.repository.storePendingMatch(matchedUser.sessionId, waitingPayload);
        }

        const isNewUserActive = await this.repository.isActiveListener(sessionId);
        
        const newUserPayload = { ...matchData, partner: matchedUser.user, partnerSessionId: matchedUser.sessionId };

        if (isNewUserActive) {
            this.notifier.notifyMatchFound(sessionId, newUserPayload);
            await this.repository.removeActiveListener(sessionId);
        } else {
            // Store pending match via repository
            await this.repository.storePendingMatch(sessionId, newUserPayload);
        }

        return sessionId;
    }

    async checkPendingMatch(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to check for pending matches.");
        }
        
        return await this.repository.getPendingMatch(sessionId);
    }

    async sessionInQueue(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to check queue status.");
        }
        return await this.repository.sessionInQueue(sessionId);
    }

    async removeFromQueue(user) {
        if (!user) {
            throw new ApiError(400, "User is required to remove from the queue.");
        }
        const result = await this.repository.removeFromQueue(user);
        return result;
    }

    async exitQueue(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to exit the queue.");
        }
        
        // Use repository's complete cleanup method
        const result = await this.repository.cleanupSession(sessionId);
        return result;
    }
    
    // TODO: clean up queue after closing
    
    // simple session id generator
    // TODO: change to be more complex and not guessable and constant size?
    createSessionId(user) {
        return `session-${user.id}-${Date.now()}`;
    }
}