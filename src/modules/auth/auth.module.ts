import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'modules/users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { configService } from 'core/config.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailModule } from '../email/email.module';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { AdminsModule } from 'modules/admins/admins.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => AdminsModule),
    PassportModule,
    EmailModule,
    JwtModule.register({
      secret: configService.getJwtSecret(),
      signOptions: {
        expiresIn: configService.getJwtExpire(),
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, ApiKeyStrategy],
  exports: [AuthService],
})
export class AuthModule {}
