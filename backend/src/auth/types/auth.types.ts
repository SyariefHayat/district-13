export type CanonicalUserRole = 'owner' | 'admin' | 'cashier';
export type LegacyUserRole = 'OWNER' | 'ADMIN' | 'CASHIER';
export type UserRole = CanonicalUserRole | LegacyUserRole;

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  sessionId: string;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
