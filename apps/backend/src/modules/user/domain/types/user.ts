export const userRoles = {
  user: 'user',
  admin: 'admin',
} as const;

export type UserRole = (typeof userRoles)[keyof typeof userRoles];

export interface User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
}
