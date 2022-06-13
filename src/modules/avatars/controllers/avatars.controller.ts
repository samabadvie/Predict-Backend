import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { AvatarEntity } from '../entities/avatar.entity';
import { AvatarsService } from '../services/avatars.service';

@ApiTags('Avatars')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('Avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  /**
   * Get list of free avatars
   *
   * @returns list of AvatarEntity
   */

  @Get('freeAvatars')
  freeAvatars(): Promise<AvatarEntity[]> {
    return this.avatarsService.find({ price: 0 });
  }
}
