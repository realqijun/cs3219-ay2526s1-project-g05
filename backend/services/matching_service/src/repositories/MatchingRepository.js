export class MatchingRepository {
    constructor() {
        this.userQueue = null;
        this.matchStates = null;
        this.userMatches = null;
        this.activeListeners = null;
        this.QUEUE_WINDOW = 100; // Number of sessions to consider when matching
    }

    async initialize() {
        this.userQueue = {};
        this.matchStates = {};
        this.userMatches = {};
        this.activeListeners = new Set();
    }

    // --- Criteria and Utility ---

    topicsMatch(requiredTopics, availableTopics) {
        if (requiredTopics.length === 0) {
            return true;
        }
        if (availableTopics.length === 0) {
            return false;
        }
        const availableSet = new Set(availableTopics);
        return requiredTopics.some(topic => availableSet.has(topic));
    }

    meetsCriteria(criteria, otherCriteria) {
        const criteriaTopics = criteria.topics || [];
        const otherTopics = otherCriteria.topics || [];

        const criteriaDifficulty = criteria.difficulty || null;
        const otherDifficulty = otherCriteria.difficulty || null;

        if (criteriaDifficulty && otherDifficulty && criteriaDifficulty !== otherDifficulty) {
            return false;
        }

        return this.topicsMatch(criteriaTopics, otherTopics) &&
            this.topicsMatch(otherTopics, criteriaTopics);
    }

    // --- User State ---

    async getUserData(userId) {
        return this.userQueue[userId] || null;
    }

    async userInQueue(user) {
        return user.id in this.userQueue;
    }

    // --- Queue Management ---

    async enterQueue(user, criteria, score = null) {
        const userId = user.id;
        const sessionData = {
            user: user,
            criteria: criteria,
            timestamp: Date.now()
        };
        this.userQueue[userId] = sessionData;
        return userId;
    }

    async findMatch(criteria) {
        for (const userId in this.userQueue) {
            if (!Object.prototype.hasOwnProperty.call(this.userQueue, userId)) {
                continue;
            }
            if (this.matchStates[userId]) {
                continue;
            }
            const sessionData = this.userQueue[userId];
            const queuedCriteria = sessionData.criteria;
            if (this.meetsCriteria(criteria, queuedCriteria)) {
                const user = sessionData.user;
                return {
                    user: user,
                    criteria: queuedCriteria,
                    userId: userId
                };
            }
        }
        return null;
    }

    // --- Match State management ---

    async getMatchId(userId) {
        return this.userMatches[userId] || null;
    }

    async getMatchState(matchId) {
        return this.matchStates[matchId] || null;
    }

    async storeMatchState(matchId, matchState) {
        this.matchStates[matchId] = matchState;
        return true;
    }

    async storePendingMatch(userId, matchId) {
        this.userMatches[userId] = matchId;
        return true;
    }

    async getPendingMatch(userId) {
        const matchId = this.getMatchId(userId);
        return this.matchStates[matchId] || null;
    }

    // --- Cleanup and Deletion ---

    async deletePendingMatch(userId) {
        const matchId = await this.getMatchId(userId);
        if (!matchId) {
            return false;
        }
        delete this.userMatches[userId];
        return true;
    }

    async deleteUser(userId) {
        delete this.userQueue[userId];
        await this.deletePendingMatch(userId);
        return true;
    }

    async deleteMatch(matchId) {
        const matchState = await this.getMatchState(matchId);
        if (matchState) {
            for (const userId in matchState.users) {
                if (Object.prototype.hasOwnProperty.call(matchState.users, userId)) {
                    await this.deletePendingMatch(userId);
                }
            }
        }
        delete this.matchStates[matchId];
        return true;
    }

    // --- Active Listener Management ---

    async addActiveListener(sessionId) {
        this.activeListeners.add(sessionId);
        return true;
    }

    async removeActiveListener(sessionId) {
        this.activeListeners.delete(sessionId);
        return true;
    }

    async isActiveListener(sessionId) {
        return this.activeListeners.has(sessionId);
    }

    // --- Stale Session Management ---

    async getStaleSessions(timeoutMs = 300000) {
        const now = Date.now();
        const staleSessionIds = [];
        const sessionIds = await this.redis.zRange(this.QUEUE_KEY, 0, -1);
        for (const sessionId of sessionIds) {
            const sessionTimestamp = await this.redis.hGet(`${this.SESSION_PREFIX}${sessionId}`, 'timestamp');
            if (sessionTimestamp && (now - parseInt(sessionTimestamp, 10) > timeoutMs)) {
                staleSessionIds.push(sessionId);
            }
        }
        return staleSessionIds;
    }
};