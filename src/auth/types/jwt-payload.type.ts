import { UserRole } from '../entities/user.entity';

export type JwtPayload = {
  sub: number;
  email: string;
  role: UserRole;
};
