import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginResponseSchema } from '../schemas/login.response.schema';
import { UsersService } from '../../users/services/users.services';
import { compareSync } from 'bcrypt';
import { UserEntity } from 'modules/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '../../../core/exceptions';
import { configService } from 'core/config.service';
import { AdminsService } from 'modules/admins/services/admins.service';
import { AdminEntity } from 'modules/admins/entities/admin.entity';
import { UpdateTypesEnum } from 'modules/users/enums/update-types.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly adminsService: AdminsService,
  ) {}

  validateApiKey(apiKey: string): boolean {
    return apiKey == configService.getAPIKey();
  }

  async validateUser(username: string, password: string): Promise<UserEntity | null> {
    const user = await this.usersService.findOne({ username });

    if (!user || !user.password_hash) return null;

    const compareResult = compareSync(password, user.password_hash);

    if (!compareResult) return null;

    return user;
  }

  async jwtValidateUser(id: number): Promise<UserEntity | null> {
    const user = await this.usersService.findOne({ id });

    if (!user) return null;

    return user;
  }

  async jwtValidateAdmin(id: number): Promise<AdminEntity | null> {
    const admin = await this.adminsService.findOne({ id });

    if (!admin) return null;

    return admin;
  }

  async login(username: string, password: string, first_time?: boolean): Promise<LoginResponseSchema | void> {
    let findUser: UserEntity | undefined;

    if (first_time) {
      findUser = await this.usersService.findOne({ username });
    } else {
      findUser = await this.usersService.findOne({ username, email_verified: true });
    }

    if (!findUser) {
      throw new ConflictException([
        {
          message: 'Wrong username or password!',
          field: 'wrongInput',
          validation: 'wrong',
        },
      ]);
    }
    const userPassword = findUser.password_hash || '';
    if (findUser && compareSync(password, userPassword)) {
      const payload = {
        name: username,
        sub: findUser ? findUser.id : 0,
      };

      await this.usersService.queueProducer.updatesQueue.add({
        user_id: findUser.id,
        newLogin: true,
        type: UpdateTypesEnum.LOGIN,
      });

      return {
        token: this.jwtService.sign(payload),
        userData: findUser,
      };
    } else {
      throw new ConflictException([
        {
          message: 'Wrong username or password!',
          field: 'wrongInput',
          validation: 'wrong',
        },
      ]);
    }
  }

  async loginAdmin(username: string, password: string): Promise<LoginResponseSchema | void> {
    const findAdmin = await this.adminsService.findOne({ username });

    if (!findAdmin) {
      throw new UnauthorizedException();
    }
    const adminPassword = findAdmin.password_hash || '';
    if (findAdmin && compareSync(password, adminPassword)) {
      const payload = {
        name: username,
        sub: findAdmin ? findAdmin.id : 0,
        admin: true,
      };

      return {
        token: this.jwtService.sign(payload),
      };
    } else {
      throw new ConflictException([
        {
          message: 'Wrong username or password!',
          field: 'wrongInput',
          validation: 'wrong',
        },
      ]);
    }
  }
}
