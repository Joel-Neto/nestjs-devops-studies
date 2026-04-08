import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '../events/constants/event-names.constants';
import { UserRegisteredEvent } from 'src/events/listeners/user-registered.listener';
import { type ConfigType } from '@nestjs/config';
import { jwtConfig } from './config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOneBy({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException(
        'Email already in user! Please try with a different email',
      );
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const createdUser = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: UserRole.USER,
    });

    const savedUser = await this.userRepository.save(createdUser);

    const userRegisteredEventPayload: UserRegisteredEvent = {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
      },
      timeStamp: new Date(),
    };

    this.eventEmitter.emit(
      EventNames.USER_REGISTERED,
      userRegisteredEventPayload,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;

    return {
      user: result,
      message: 'User successfully registered! Please login to continue',
    };
  }

  async createAdmin(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOneBy({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException(
        'Email already in user! Please try with a different email',
      );
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const createdAdmin = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    const savedAdmin = await this.userRepository.save(createdAdmin);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedAdmin;

    return {
      user: result,
      message: 'Admin successfully registered! Please login to continue',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOneBy({
      email: loginDto.email,
    });

    if (
      !user ||
      !(await this.verifyPassword(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;

    return {
      user: result,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload: { sub: number } = this.jwtService.verify(refreshToken, {
        secret: this.jwtConfiguration.refreshSecret,
      });

      const user = await this.userRepository.findOneBy({ id: payload.sub });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const accessToken = this.generateAccessToken(user);

      return {
        accessToken,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  private async verifyPassword(
    plainPassword: string,
    userHashedPassword: string,
  ) {
    return bcrypt.compare(plainPassword, userHashedPassword);
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private generateTokens(user: User) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateAccessToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.secret,
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(user: User) {
    const payload = {
      sub: user.id,
    };

    return this.jwtService.sign(payload, {
      secret: this.jwtConfiguration.refreshSecret,
      expiresIn: '7d',
    });
  }
}
