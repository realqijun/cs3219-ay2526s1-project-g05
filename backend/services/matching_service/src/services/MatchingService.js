import { ApiError } from "../errors/ApiError.js";

export class MatchingService {
    constructor({ repository }) {
        this.repository = repository;
        this.pendingMatches = {};
        this.activeListeners = {};

        // circular dependency
        this.notifier = null;
    }

    async setNotifier(controller) {
        this.notifier = controller;
    }

    async addActiveListener(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to add active listener.");
        }
        const pendingMatch = this.checkPendingMatch(sessionId);
        if (pendingMatch) {
           return { notified: true, data: pendingMatch };
        }

        if (!this.repository.sessionInQueue(sessionId)) {
             throw new ApiError(404, "Session ID not found in queue.");
        }
        this.activeListeners[sessionId] = true;
        return { notified: false  };
    }

    async removeActiveListener(sessionId) {
        delete this.activeListeners[sessionId];
        await this.repository.removeFromQueue(sessionId);
        return true;
    }

    async clearFromQueue(sessionId) {
        if (!sessionId) {
            throw new ApiError(400, "Session ID is required to clear from the queue.");
        }
        if (this.activeListeners[sessionId]) {
            delete this.activeListeners[sessionId];
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

        const matchedUser = await this.repository.dequeueAndLockUser(criteria);
        const sessionId = this.createSessionId(user);
        if (!matchedUser) {
            await this.repository.enterQueue(user, sessionId, criteria);
            return sessionId;
        }

        const matchData = {
            // TODO: query collab service and question service
            criteria: criteria
        }

        // user has called getstatus ans is waiting
        const isWaitingActive = this.activeListeners[matchedUser.sessionId];
        const waitingPayload = { ...matchData, partner: user, partnerSessionId: sessionId };

        if (isWaitingActive) {
            this.notifier.notifyMatchFound(matchedUser.sessionId, waitingPayload);
            delete this.activeListeners[matchedUser.sessionId];
        } else {
            this.pendingMatches[matchedUser.sessionId] = waitingPayload;
        }

        const isNewUserActive = this.activeListeners[sessionId];
        const newUserPayload = { ...matchData, partner: matchedUser.user, partnerSessionId: matchedUser.sessionId };

        if (isNewUserActive) {
            this.notifier.notifyMatchFound(sessionId, newUserPayload);
            delete this.activeListeners[sessionId];
        } else {
            this.pendingMatches[sessionId] = newUserPayload;
        }

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