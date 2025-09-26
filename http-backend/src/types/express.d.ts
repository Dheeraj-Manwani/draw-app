declare global {
  namespace Express {
    interface Request {
      userId?: string; // Clerk user ID from token.sub
      auth?: {
        userId: string;
        sessionId: string;
        sessionClaims?: Record<string, any>;
        orgId?: string;
        orgRole?: string;
        orgSlug?: string;
        orgPermissions?: string[];
      };
    }
  }
}
