import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  if (!process.env.REFRESH_SECRET) throw new Error('REFRESH_SECRET is not set');

  return {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.REFRESH_SECRET,
  };
});
