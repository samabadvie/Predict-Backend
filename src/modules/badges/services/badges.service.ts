import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBadgeDto } from '../dtos/create-badge.dto';
import { UpdateBadgeDto } from '../dtos/update-badge.dto';
import { BadgeEntity } from '../entities/badges.entity';
import { BadgesListSchema } from '../schemas/badges-list.schema';

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(BadgeEntity, 'mysql')
    private readonly badgesRepository: Repository<BadgeEntity>,
  ) {}

  private async upsertBadge(update: Partial<BadgeEntity>): Promise<Partial<BadgeEntity> | void> {
    try {
      const findRow = await this.badgesRepository.findOneOrFail({ id: update.id });
      Object.assign(findRow, update);
      return await this.badgesRepository.save(findRow);
    } catch (e) {
      try {
        return await this.badgesRepository.save(update);
      } catch (e) {}
    }
  }

  async getList(): Promise<BadgesListSchema[]> {
    const result: BadgesListSchema[] = [];
    let tmpName = '';

    const badges = await this.badgesRepository.createQueryBuilder('query').orderBy('query.id', 'ASC').getMany();

    badges.forEach((badge) => {
      if (badge.name != tmpName) {
        result.push({
          id: badge.id,
          name: badge.name.split('_').join(' '),
          icon: badge.icon,
        });
        tmpName = badge.name;
      }
    });

    return result;
  }

  findAll(): Promise<BadgeEntity[]> {
    return this.badgesRepository.find();
  }

  async findWithNameAndLevel(name: string, level: number): Promise<number> {
    const entity = await this.badgesRepository.findOne({ name, level });
    return entity ? entity.count : 0;
  }

  findWithId(id: number): Promise<BadgeEntity | undefined> {
    return this.badgesRepository.findOne(id);
  }

  createOne(input: CreateBadgeDto): Promise<BadgeEntity> {
    return this.badgesRepository.save(input);
  }

  updateBadges(input: UpdateBadgeDto): Promise<Partial<BadgeEntity> | void> {
    return this.upsertBadge(input);
  }
}
