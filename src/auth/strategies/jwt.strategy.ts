import { AuthService } from './../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }
  async validate(payload: any) {
    try {
      const user = await this.authService.getUserById(payload.id);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }
      return {
        ...user,
        role: payload.role_name,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
