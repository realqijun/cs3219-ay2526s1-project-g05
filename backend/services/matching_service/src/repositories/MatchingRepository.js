export class MatchingRepository {
    constructor() {
        this.match_queue = [];
    }

    async find_match(user, criteria) {
        if (this.match_queue.length === 0) {
            this.match_queue.push({ user, criteria });

            return null;
        }

        for (let i = 0; i < this.match_queue.length; i++) {
            const queued = this.match_queue[i];
            if (this.meetsCriteria(queued.criteria, criteria)) {
                // Remove matched user from queue
                this.match_queue.splice(i, 1);

                return queued.user;
            }
        }

        this.match_queue.push({ user, criteria });
        
        return null;
    }

    meetsCriteria(queuedCriteria, criteria) {
        return JSON.stringify(queuedCriteria) === JSON.stringify(criteria);
    }

    async cancel_match(user) {
        this.match_queue = this.match_queue.filter(entry => entry.user.id !== user.id);
        return true;
    }   
};