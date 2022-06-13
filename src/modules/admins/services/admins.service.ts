import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminEntity } from '../entities/admin.entity';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(AdminEntity, 'mysql')
    private readonly adminRepository: Repository<AdminEntity>,
  ) {}

  saveAdmin(input: Partial<AdminEntity>): Promise<AdminEntity> {
    return this.adminRepository.save(input);
  }

  findOne(input: Partial<AdminEntity>): Promise<AdminEntity | undefined> {
    return this.adminRepository.findOne(input);
  }
}
