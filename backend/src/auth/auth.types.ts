export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER';

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
