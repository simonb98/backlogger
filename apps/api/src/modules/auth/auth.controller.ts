import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SteamAuthService } from './steam-auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly steamAuthService: SteamAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: CurrentUserPayload) {
    const fullUser = await this.authService.findById(user.id);
    return {
      id: fullUser?.id,
      email: fullUser?.email,
      displayName: fullUser?.displayName,
      steamId: fullUser?.steamId,
      steamAvatar: fullUser?.steamAvatar,
    };
  }

  @Get('steam')
  @ApiOperation({ summary: 'Redirect to Steam login' })
  steamLogin(@Res() res: Response) {
    const returnUrl = this.configService.get<string>('app.url') + '/api/v1/auth/steam/callback';
    const steamLoginUrl = this.steamAuthService.getLoginUrl(returnUrl);
    res.redirect(steamLoginUrl);
  }

  @Get('steam/callback')
  @ApiOperation({ summary: 'Steam login callback' })
  async steamCallback(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const steamProfile = await this.steamAuthService.validateCallback(query);
      const authResponse = await this.authService.loginOrRegisterWithSteam(steamProfile);

      // Redirect to frontend with token
      const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:4200';
      res.redirect(`${frontendUrl}/auth/steam-callback?token=${authResponse.accessToken}`);
    } catch (error) {
      const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:4200';
      res.redirect(`${frontendUrl}/login?error=steam_auth_failed`);
    }
  }
}

