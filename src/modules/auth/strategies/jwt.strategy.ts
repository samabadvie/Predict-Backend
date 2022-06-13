import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';
import { configService } from 'core/config.service';
import { UserEntity } from '../../users/entities/user.entity';
import { AdminEntity } from 'modules/admins/entities/admin.entity';

interface IPayload {
  name: string;
  sub: number;
  admin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.getJwtSecret(),
    });
  }

  async validate(payload: IPayload): Promise<UserEntity | AdminEntity> {
    let result;

    if (!payload.admin) {
      result = await this.authService.jwtValidateUser(payload.sub);
      if (!result) throw new UnauthorizedException('Unauthorize Error!');
    } else {
      result = await this.authService.jwtValidateAdmin(payload.sub);
      if (!result) throw new UnauthorizedException('Unauthorize Error!');
    }

    return result;
  }
}
