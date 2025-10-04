import { RedisClient } from '../database/RedisClient.js';

export class MatchingRepository {
    constructor() {
        this.redis = null;
        this.QUEUE_KEY = 'matching:queue';
        this.SESSION_PREFIX = 'matching:session:';
        this.USER_PREFIX = 'matching:user:';
        this.ACTIVE_LISTENERS_KEY = 'matching:active_listeners';
        this.PENDING_MATCHES_KEY = 'matching:pending:';

        this.QUEUE_WINDOW = 100; // Number of sessions to consider when matching
    }

    async initialize() {
        await RedisClient.connect();
        this.redis = RedisClient.getClient();
    }

    async enterQueue(user, sessionId, criteria) {
        const queueEntry = {
            user: JSON.stringify(user),
            criteria: JSON.stringify(criteria),
            timestamp: Date.now().toString()
        };
        
        const multi = this.redis.multi();
        
        // Add to sorted set prefix z (queue) with timestamp as score for FIFO ordering
        multi.zAdd(this.QUEUE_KEY, {
            score: Date.now(),
            value: sessionId
        });
        
        // Store session details in hash
        multi.hSet(`${this.SESSION_PREFIX}${sessionId}`, queueEntry);
        
        // Store user to session mapping for duplicate prevention
        multi.set(`${this.USER_PREFIX}${user.id}`, sessionId);
        
        await multi.exec();
        return true;
    }
    
    // TODO: improve criteria matching logic
    meetsCriteria(queuedCriteria, criteria) {
        return JSON.stringify(queuedCriteria) === JSON.stringify(criteria);
    }

    async dequeueAndLockUser(criteria) {
        // Get a batch of sessions
        const sessionIds = await this.redis.zRange(this.QUEUE_KEY, 0, this.QUEUE_WINDOW);
        
        for (const sessionId of sessionIds) {
            const sessionData = await this.redis.hGetAll(`${this.SESSION_PREFIX}${sessionId}`);
            
            if (!sessionData.criteria) {
                await this.removeFromQueue(sessionId); // corrupt sesh
                continue;
            }
            
            const criteria = JSON.parse(sessionData.criteria);
            
            if (this.meetsCriteria(criteria, criteria)) {
                const user = JSON.parse(sessionData.user);
                const userKey = `${this.USER_PREFIX}${user.id}`;
                
                // optimistic locking, will abort if concurrent change
                this.redis.watch(this.QUEUE_KEY);
                
                const multi = this.redis.multi();

                multi.zScore(this.QUEUE_KEY, sessionId); // check still present

                multi.zRem(this.QUEUE_KEY, sessionId);
                multi.del(`${this.SESSION_PREFIX}${sessionId}`);
                multi.del(userKey);
                
                console.log(`Attempting to lock and remove session ${sessionId} for user ${user.id}`);
                const result = await multi.exec();
                console.log(result);
                if (result === null) {
                    console.warn(`WATCH failed for session ${sessionId}. Retrying match...`);
                    continue;
                }
                
                // Check the result of ZSCORE from the transaction
                const zScoreResult = result[0];
                if (zScoreResult === null) {
                    // This means the element was already removed just before our ZSCORE check.
                    continue;
                }
                
                // SUCCESS: Match found and atomically removed
                return {
                    user: user,
                    sessionId: sessionId,
                    criteria: criteria
                };
            }
        }
        
        // no match
        return null;
    }

    async removeFromQueue(sessionId) {
        // Get user info first to clean up user mapping
        const sessionData = await this.redis.hGetAll(`${this.SESSION_PREFIX}${sessionId}`);
        
        const multi = this.redis.multi();
        
        if (sessionData.user) {
            const user = JSON.parse(sessionData.user);
            multi.del(`${this.USER_PREFIX}${user.id}`);
        }
        
        multi.zRem(this.QUEUE_KEY, sessionId);
        multi.del(`${this.SESSION_PREFIX}${sessionId}`);
        
        await multi.exec();
        return true;
    }

    async sessionInQueue(sessionId) {
        return (await this.redis.zScore(this.QUEUE_KEY, sessionId)) !== null;
    }

    async userInQueue(user) {
        return (await this.redis.exists(`${this.USER_PREFIX}${user.id}`)) === 1;
    }

    // Active Listener Management
    async addActiveListener(sessionId) {
        await this.redis.hSet(this.ACTIVE_LISTENERS_KEY, sessionId, Date.now().toString());
        return true;
    }

    async removeActiveListener(sessionId) {
        await this.redis.hDel(this.ACTIVE_LISTENERS_KEY, sessionId);
        return true;
    }

    async isActiveListener(sessionId) {
        return (await this.redis.hExists(this.ACTIVE_LISTENERS_KEY, sessionId)) === 1;
    }

    // Pending Match Management
    async storePendingMatch(sessionId, matchData) {
        const key = `${this.PENDING_MATCHES_KEY}${sessionId}`;
        await this.redis.set(key, JSON.stringify(matchData));
        
        // expiration 5 minutes
        await this.redis.expire(key, 300); 
        return true;
    }

    async getPendingMatch(sessionId) {
        const key = `${this.PENDING_MATCHES_KEY}${sessionId}`;
        // Use GETDEL (or a transaction with GET and DEL) to read and consume atomically
        const matchData = await this.redis.getDel(key); 

        if (matchData) {
            return JSON.parse(matchData);
        }
        return null;
    }

    async removePendingMatch(sessionId) {
        await this.redis.del(`${this.PENDING_MATCHES_KEY}${sessionId}`);
        return true;
    }

    // Complete cleanup for a session
    async cleanupSession(sessionId) {
        const multi = this.redis.multi();
        
        const sessionData = await this.redis.hGetAll(`${this.SESSION_PREFIX}${sessionId}`);
        
        if (sessionData.user) {
            const user = JSON.parse(sessionData.user);
            multi.del(`${this.USER_PREFIX}${user.id}`);
        }
        
        // Remove from all Redis structures
        multi.zRem(this.QUEUE_KEY, sessionId);
        multi.del(`${this.SESSION_PREFIX}${sessionId}`);
        multi.hDel(this.ACTIVE_LISTENERS_KEY, sessionId);
        multi.del(`${this.PENDING_MATCHES_KEY}${sessionId}`);
        
        await multi.exec();
        return true;
    }
};