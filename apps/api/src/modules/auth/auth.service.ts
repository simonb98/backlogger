import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities';
import { RegisterDto, LoginDto } from './dto';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email?: string;
    displayName?: string;
    steamId?: string;
    steamAvatar?: string;
  };
}

export interface SteamProfile {
  steamId: string;
  personaName: string;
  avatar: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check if user exists
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = this.userRepository.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      displayName: dto.displayName,
    });

    const saved = await this.userRepository.save(user);

    return this.generateAuthResponse(saved);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findBySteamId(steamId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { steamId } });
  }

  async loginOrRegisterWithSteam(profile: SteamProfile): Promise<AuthResponse> {
    // Check if user with this Steam ID already exists
    let user = await this.findBySteamId(profile.steamId);

    if (user) {
      // Update avatar and display name if changed
      user.steamAvatar = profile.avatar;
      if (!user.displayName) {
        user.displayName = profile.personaName;
      }
      await this.userRepository.save(user);
      return this.generateAuthResponse(user);
    }

    // No user with this Steam ID - check if there's a user who imported games from this Steam account
    // (they would have the Steam ID linked from the import process)
    // This is handled by the linkSteamToUser during import, so if we get here, it's a new user

    // Create new user with Steam account
    user = this.userRepository.create({
      steamId: profile.steamId,
      displayName: profile.personaName,
      steamAvatar: profile.avatar,
    });
    user = await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  async linkSteamToUser(userId: number, steamId: string, steamAvatar?: string): Promise<void> {
    // Check if this Steam ID is already linked to another user
    const existingUser = await this.findBySteamId(steamId);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('This Steam account is already linked to another user');
    }

    await this.userRepository.update(userId, { steamId, steamAvatar });
  }

  private generateAuthResponse(user: User): AuthResponse {
    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        steamId: user.steamId,
        steamAvatar: user.steamAvatar,
      },
    };
  }
}

