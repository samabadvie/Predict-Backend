import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BaseResponseSchema } from 'core/base-response.schema';
import { IReq } from 'core/interfaces';
import { ApiKeyAuthGuard } from 'modules/auth/guards/api-key.guard';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { IdDto } from 'modules/users/dtos/id.dto';
import { usernameDto } from 'modules/users/dtos/username.dto';
import { AccessRequestEntity } from '../entities/access-request.entity';
import { AccessRequestListSchema } from '../schemas/access-request-list.schema';
import { AccessRequestService } from '../services/access-request.service';

@ApiTags('Access Request')
@ApiSecurity('X-Api-Key')
@UseGuards(ApiKeyAuthGuard)
@Controller('access-request')
export class AccessRequestController {
  constructor(private readonly accessRequestService: AccessRequestService) {}

  /**
   * Get list of Access Request for current user
   *
   */

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('list')
  findAll(@Req() req: IReq): Promise<Partial<AccessRequestListSchema[]>> {
    return this.accessRequestService.findAll(req.user);
  }

  /**
   * Send Access Request from current user to another with username
   *
   * @param username
   */

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Post(':username')
  createOne(@Req() req: IReq, @Param('') { username }: usernameDto): Promise<AccessRequestEntity> {
    return this.accessRequestService.createOne(req.user, username);
  }

  /**
   * Allow Access with id
   *
   * @param id
   */

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('allowAccess')
  async allowAccess(@Req() req: IReq, @Body() { id }: IdDto): Promise<BaseResponseSchema> {
    const result = await this.accessRequestService.allowAccess(req.user, id);
    result.accessList = await this.accessRequestService.findAll(req.user);
    return result;
  }

  /**
   * Deny Access with id
   *
   * @param id
   */

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Patch('denyAccess')
  async denyAccess(@Req() req: IReq, @Body() { id }: IdDto): Promise<BaseResponseSchema> {
    const result = await this.accessRequestService.denyAccess(req.user, id);
    result.accessList = await this.accessRequestService.findAll(req.user);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('bearer')
  @Get('lastAccessRequestTime')
  getLastAccessRequestTime(@Req() req: IReq): Promise<number> {
    return this.accessRequestService.getLastAccessRequestTime(req.user);
  }
}
