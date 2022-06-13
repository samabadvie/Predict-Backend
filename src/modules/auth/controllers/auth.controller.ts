import { Body, Controller, Inject, Post, forwardRef, UseGuards } from '@nestjs/common';
import { CommonApiDecorators } from 'responses/common-decorators.response';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { UsersService } from '../../users/services/users.services';
import { ConflictException, FlowException } from '../../../core/exceptions';
import { hashSync } from 'bcrypt';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LoginResponseSchema } from '../schemas/login.response.schema';
import { LoginDto } from '../dtos/login.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ConfirmOtpcodeResponseSchema } from '../../users/schemas/confirm-otpcode-response.schema';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ConfirmForgotPasswordDto } from '../dtos/confirm-forgot-password.dto';
import { ApiKeyAuthGuard } from '../guards/api-key.guard';
import { BaseResponseSchema } from '../../../core/base-response.schema';
import { RegisterAdminDto } from '../dtos/register-admin.dto';
import { AdminsService } from 'modules/admins/services/admins.service';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('Auth')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AdminsService))
    private readonly adminsService: AdminsService,
  ) {}

  /**
   * Register new User with username, password, referral_code, email
   *
   * @returns LoginResponseSchema
   */

  @Post('registerUser')
  @CommonApiDecorators()
  async registerUser(
    @Body() { username, password, referral_code, email }: RegisterDto,
  ): Promise<LoginResponseSchema | void> {
    const userDuplicateEmail = await this.usersService.findOne({ email, email_verified: true });

    if (userDuplicateEmail) {
      throw new ConflictException([
        {
          message: 'Email is already registered!',
          field: 'email',
          validation: 'email',
        },
      ]);
    }

    await this.usersService.saveUser({ username, password_hash: hashSync(password, 10) }, referral_code);

    return this.authService.login(username, password, true);
  }

  /**
   * Login user
   *
   * @returns LoginResponseSchema
   */

  @Post('login')
  @CommonApiDecorators()
  login(@Body() { username, password }: LoginDto): Promise<LoginResponseSchema | void> {
    return this.authService.login(username, password);
  }

  /**
   * Forgot password
   *
   * @returns BaseResponseSchema
   */

  @Post('forgotpassword')
  @CommonApiDecorators()
  async forgotPassword(@Body() { email }: ForgotPasswordDto): Promise<BaseResponseSchema> {
    const user = await this.usersService.findOne({ email });
    if (!user) {
      throw new FlowException([
        {
          message: 'This email is not verified!',
          field: 'email',
          validation: 'not found',
        },
      ]);
    }

    return this.usersService.sendEmailVerificationCode(user.username, user.id, email);
  }

  /**
   * Confirm otp code
   *
   * @returns ConfirmOtpcodeResponseSchema
   */

  @Post('confirmForgotpasswordOtpCode')
  @CommonApiDecorators()
  async confirmEmailOtpCode(
    @Body() { otpcode, email }: ConfirmForgotPasswordDto,
  ): Promise<ConfirmOtpcodeResponseSchema> {
    const user = await this.usersService.findOtpcode({ email, otpcode });
    if (!user) {
      throw new FlowException([
        {
          message: 'OTP code is incorrect!',
          field: 'otpcode',
          validation: 'wrong',
        },
      ]);
    }

    return this.usersService.confirmEmailOtpCode(user.user_id, otpcode);
  }

  /**
   * Reset password with email
   *
   * @returns BaseResponseSchema
   */

  @Post('resetPassword')
  @CommonApiDecorators()
  async resetPassword(@Body() { email, password, confirm_password }: ResetPasswordDto): Promise<BaseResponseSchema> {
    if (password != confirm_password) {
      throw new ConflictException([
        {
          message: 'The passwords do NOT match!',
          field: 'confirm_password',
          validation: 'conflict',
        },
      ]);
    }

    const user = await this.usersService.findOne({ email });
    if (!user) {
      throw new FlowException([
        {
          message: 'This email is not verified!',
          field: 'email',
          validation: 'not found',
        },
      ]);
    }

    await this.usersService.updatePassword(user.id, password);

    return {
      message: 'Password changed successfully.',
    };
  }

  /**
   * Login admin
   *
   * @returns LoginResponseSchema
   */

  @ApiTags('Admin APIs')
  @Post('loginAdmin')
  @CommonApiDecorators()
  loginAdmin(@Body() { username, password }: LoginDto): Promise<LoginResponseSchema | void> {
    return this.authService.loginAdmin(username, password);
  }

  /**
   * Register new admin (from another admin)
   *
   * @returns LoginResponseSchema
   */

  @ApiTags('Admin APIs')
  @Post('registerAdmin')
  @UseGuards(AdminGuard)
  @ApiSecurity('bearer')
  async registerAdmin(@Body() { username, password }: RegisterAdminDto): Promise<LoginResponseSchema | void> {
    const adminDuplicate = await this.adminsService.findOne({ username });

    if (adminDuplicate) {
      throw new ConflictException([
        {
          message: 'This username is exist for another admin!',
          field: 'username',
          validation: 'username',
        },
      ]);
    }

    await this.adminsService.saveAdmin({ username, password_hash: hashSync(password, 10) });

    return this.loginAdmin({ username, password });
  }
}
