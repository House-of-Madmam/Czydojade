import type { UserRole } from '../../modules/user/domain/types/user.ts';

export interface TokenPayload {
  readonly userId: string;
  readonly email: string;
  readonly role: UserRole;
  readonly iat?: number; // issued at
  readonly exp?: number; // expiration time
}
