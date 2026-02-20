import { User } from '../entities/user.entity';

export type CurrentUserType = Omit<User, 'password'>;
