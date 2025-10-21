import { ApiError } from "../errors/ApiError.js";
import crypto from "crypto";

export class MatchingService {
    constructor({ repository }) {
        this.repository = repository;
        this.notifier = null;
    }

    async setNotifier(controller) {
        this.notifier = controller;
    }

    createMatchId() {
        return `match-${crypto.randomUUID()}`;
    }

    async _fetch_pro_max(uri, options) {
        try {
            const response = await fetch(uri, options);
            if (!response.ok) {
                throw new ApiError(response.status, `Failed to fetch: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            throw new ApiError(500, "Internal Server Error");
        }
    }

    _validateEntryRequest(user, criteria) {
        if (!user || !criteria) {
            throw new ApiError(400, "User and criteria are required to enter the queue.");
        }
        if (typeof criteria !== 'object' || !criteria.difficulty || !Array.isArray(criteria.topics)) {
            throw new ApiError(400, "Criteria must include 'difficulty' and 'topics' array.");
        }
    }

    async enterQueue(user, criteria) {
        this._validateEntryRequest(user, criteria);
        if (await this.repository.userInQueue(user.id)) {
            throw new ApiError(400, "User is already in the matching queue.");
        }

        const userId = await this.repository.enterQueue(user, criteria);
        
        const matchedUserInfo = await this.repository.findMatch(userId, criteria);
        if (!matchedUserInfo) {
            return userId;
        }

        const userA = { user: user, userId: userId };
        const userB = { user: matchedUserInfo.user, userId: matchedUserInfo.userId };

        const question = await this._fetch_pro_max(
            `http://localhost:${process.env.QUESTIONSERVICEPORT || 4002}/questions/random?difficulty=${criteria.difficulty}&${criteria.topics.map(t => `topics=${t}`).join('&')}`
        );

        const matchId = this.createMatchId();

        const commonMatchData = {
            matchId: matchId,
            criteria: criteria,
            question: question
        };
        const initialMatchState = {
            status: 'pending', // for debugging
            users: {
                [userA.userId]: {
                    confirmed: false,
                    user: userA.user,
                    matchDetails: { ...commonMatchData, partner: userB.user, partnerId: userB.userId }
                },
                [userB.userId]: {
                    confirmed: false,
                    user: userB.user,
                    matchDetails: { ...commonMatchData, partner: userA.user, partnerId: userA.userId }
                }
            }
        };

        await this.repository.storeMatchState(matchId, initialMatchState);
        await this.repository.storePendingMatch(userA.userId, matchId);
        await this.repository.storePendingMatch(userB.userId, matchId);

        const isUserAActive = await this.repository.isActiveListener(userA.userId);
        if (isUserAActive) {
            this.notifier.notifyMatchFound(userA.userId, initialMatchState.users[userA.userId].matchDetails);
        }
        const isUserBActive = await this.repository.isActiveListener(userB.userId);
        if (isUserBActive) {
            this.notifier.notifyMatchFound(userB.userId, initialMatchState.users[userB.userId].matchDetails);
        }

        return userId;
    }

    async addActiveListener(userId) {
        if (!userId) {
            throw new ApiError(400, "User ID is required to add active listener.");
        }
        if (await this.repository.userInQueue(userId) === false) {
            throw new ApiError(404, "User not found in queue.");
        }
        await this.repository.addActiveListener(userId);
        return true;
    }

    async removeActiveListener(userId) {
        if (!userId) {
            throw new ApiError(400, "User ID is required to remove active listener.");
        }
        await this.repository.removeActiveListener(userId);
        return true;
    }

    async getPendingMatch(userId) {
        if (!userId) {
            throw new ApiError(400, "User ID is required to check the pending queue.");
        }
        return await this.repository.getPendingMatch(userId);
    }

    async confirmMatch(userId) {
        const matchId = await this.repository.getMatchId(userId);
        if (!matchId) {
            throw new ApiError(404, "No pending match found for this user.");
        }

        let matchState = await this.repository.getMatchState(matchId);
        if (!matchState) {
            throw new ApiError(404, "Match data is invalid or expired.");
        }
        if (matchState.users[userId].confirmed) {
            throw new ApiError(400, "Match already confirmed.");
        }

        matchState.users[userId].confirmed = true;
        const partnerId = matchState.users[userId].matchDetails.partnerId;
        const partnerConfirmed = matchState.users[partnerId].confirmed;

        if (partnerConfirmed) {
            // 2nd user to confirm handles cleanup
            await this.repository.deleteMatch(matchId);
            await this.repository.deleteUser(userId);
            await this.repository.deleteUser(partnerId);

            const collab = await this._fetch_pro_max(
                `http://localhost:${process.env.COLLABORATIONSERVICEPORT || 4004}/api/collaboration/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hostUserId: userId, guestUserId: partnerId }),
            });

            const collabId = collab.session;

            this.notifier.notifyMatchFinalized(partnerId, { token: collabId });
            this.notifier.notifyMatchFinalized(userId, { token: collabId });
            return { status: 'finalized', partnerSessionId: partnerId };
        } else {
            await this.repository.storeMatchState(matchId, matchState);
            return { status: 'waiting', partnerSessionId: partnerId };
        }
    }

    async cleanupStaleSessions() {
        const timeoutMs = 5 * 60 * 1000;
        const staleIds = await this.repository.getStaleSessions(timeoutMs);
        console.log(`Cleaning up ${staleIds.length} stale sessions.`);
        if (staleIds.length === 0) {
            return;
        }
        for (const userId of staleIds) {
            this.notifier.notifySessionExpired(userId);
            await this.clearMatchAndSession(userId);
            // TODO: give user option to requeue or cancel
        }
    }

    async rejoinQueueWithPriority(oldSessionId, user, criteria) {
        if (!oldSessionId || !user || !criteria) {
            throw new ApiError(400, "Old Session ID, User, and Criteria are required.");
        }
        await this.repository.deleteSession(oldSessionId);
        const newSessionId = this.createSessionId(user);

        const PRIORITY_OFFSET = 10 * 60 * 1000;
        const priorityScore = Date.now() - PRIORITY_OFFSET;

        await this.repository.enterQueue(user, newSessionId, criteria, priorityScore);
        return newSessionId;
    }

    // Deletes the pending match if present, and deletes the session data, plus notifies partner if matched
    async clearMatchAndSession(userId) {
        if (!userId) {
            throw new ApiError(400, "Session ID is required to clear from queue and pending match.");
        }
        const matchId = await this.repository.getMatchId(userId);
        if (matchId) {
            const matchState = await this.repository.getMatchState(matchId);
            if (matchState) {
                await this.repository.deleteMatch(matchId);
                const partnerId = matchState.users[userId].matchDetails.partnerId;
                await this.repository.deletePendingMatch(partnerId);
                this.notifier.notifyMatchCancelled(partnerId, { message: `Partner cancelled match request. You have been re-queued with priority.` });
            }
        }
        await this.repository.deleteSession(userId);
        return true;
    }

    // called by redis subscriber upon pendingmatch key expiration
    async handleMatchTimeout(expiredMatchId) {
        const matchState = await this.repository.getPersistentMatchState(expiredMatchId);
        if (!matchState) {
            return;
        }

        const userASessionId = matchState.users[Object.keys(matchState.users)[0]].matchDetails.partnerSessionId;
        const userBSessionId = matchState.users[userASessionId].matchDetails.partnerSessionId;

        const userAConfirmed = matchState.users[userASessionId].confirmed;
        const userBConfirmed = matchState.users[userBSessionId].confirmed;

        let requeueSessionId = null;

        if (userAConfirmed && !userBConfirmed) {
            requeueSessionId = userASessionId;
        } else if (userBConfirmed && !userAConfirmed) {
            requeueSessionId = userBSessionId;
        }

        let sessionData = null;
        if (requeueSessionId) {
            sessionData = await this.repository.getSessionData(requeueSessionId);
        }

        await this.repository.deleteMatch(expiredMatchId);

        if (sessionData) {
            const requeueUser = JSON.parse(sessionData.user);
            const requeueCriteria = JSON.parse(sessionData.criteria);
            const newSessionId = await this.rejoinQueueWithPriority(requeueSessionId, requeueUser, requeueCriteria);
            this.notifier.notifyMatchCancelled(requeueSessionId, { message: `Partner timed out. You have been re-queued with priority, use newSessionId:${newSessionId}.` });
        }
    }
}