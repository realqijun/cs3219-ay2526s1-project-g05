export class MatchingRepository {
    constructor() {
        this.match_queue = [];
    }

    async enterQueue(user, sessionId, criteria) {
        this.match_queue.push({ user, sessionId, criteria });
        return true;
    }
    
    // TODO: improve criteria matching logic
    meetsCriteria(queuedCriteria, criteria) {
        return JSON.stringify(queuedCriteria) === JSON.stringify(criteria);
    }

    dequeueAndLockUser(criteria) {
        for (let i = 0; i < this.match_queue.length; i++) {
            const entry = this.match_queue[i];
            if (this.meetsCriteria(entry.criteria, criteria)) {
                // Remove from queue
                this.match_queue.splice(i, 1);

                return { user: entry.user, sessionId: entry.sessionId, criteria: entry.criteria};
            }
        }
        return null;
    }

    async removeFromQueue(sessionId) {
        this.match_queue = this.match_queue.filter(entry => entry.sessionId !== sessionId);
        return true;
    }

    sessionInQueue(sessionId) {
        return this.match_queue.some(entry => entry.sessionId === sessionId);
    }

    userInQueue(user) {
        return this.match_queue.some(entry => entry.user.id === user.id);
    }
};