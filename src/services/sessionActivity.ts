interface SessionInfo {
  lastActiveAt: number;
  timeoutMinutes: number;
}

const DEFAULT_TIMEOUT_MINUTES = 480;

const sessions = new Map<string, SessionInfo>();

export const sessionActivity = {
  touch(userId: string, timeoutMinutes: number = DEFAULT_TIMEOUT_MINUTES): void {
    sessions.set(userId, { lastActiveAt: Date.now(), timeoutMinutes });
  },

  isExpired(userId: string): boolean {
    const info = sessions.get(userId);
    if (!info) return false;
    return Date.now() - info.lastActiveAt > info.timeoutMinutes * 60 * 1000;
  },

  isTracked(userId: string): boolean {
    return sessions.has(userId);
  },

  setTimeout(userId: string, timeoutMinutes: number): void {
    const info = sessions.get(userId);
    if (info) {
      info.timeoutMinutes = timeoutMinutes;
    }
  },

  revoke(userId: string): void {
    sessions.delete(userId);
  },

  getTimeout(userId: string): number {
    return sessions.get(userId)?.timeoutMinutes ?? DEFAULT_TIMEOUT_MINUTES;
  },
};
