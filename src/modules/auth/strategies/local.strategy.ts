import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserEntity } from 'modules/users/entities/user.entity';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<UserEntity | void> {
    const user = await this.authService.validateUser(username, password);

    if (!user) throw new UnauthorizedException('Username or password not correct!');

    return user;
  }
}
