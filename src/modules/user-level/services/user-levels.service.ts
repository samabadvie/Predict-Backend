import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserLevelDto } from '../dtos/create-user-level.dto';
import { UpdateUserLevelDto } from '../dtos/update-user-level.dto';
import { UserLevelEntity } from '../entities/user-levels.entity';
import { UserLevelsListSchema } from '../schemas/user-levels-list.schema';

@Injectable()
export class UserLevelsService {
  constructor(
    @InjectRepository(UserLevelEntity, 'mysql')
    private readonly userLevelsRepository: Repository<UserLevelEntity>,
  ) {}

  private async upsertUserLevel(update: Partial<UserLevelEntity>): Promise<Partial<UserLevelEntity> | void> {
    try {
      const findRow = await this.userLevelsRepository.findOneOrFail({ id: update.id });
      Object.assign(findRow, update);
      return await this.userLevelsRepository.save(findRow);
    } catch (e) {
      try {
        return await this.userLevelsRepository.save(update);
      } catch (e) {}
    }
  }

  async getList(): Promise<UserLevelsListSchema[]> {
    const result: UserLevelsListSchema[] = [];

    const userLevels = await this.userLevelsRepository.createQueryBuilder('query').orderBy('query.id', 'ASC').getMany();

    userLevels.forEach((userLevel) => {
      result.push({
        id: userLevel.id,
        name: userLevel.name,
        icon: userLevel.icon,
      });
    });

    return result;
  }

  findAll(): Promise<UserLevelEntity[]> {
    return this.userLevelsRepository.find();
  }

  find(input: Partial<UserLevelEntity>): Promise<UserLevelEntity[]> {
    return this.userLevelsRepository.find(input);
  }

  findWithId(id: number): Promise<UserLevelEntity | undefined> {
    return this.userLevelsRepository.findOne(id);
  }

  createOne(input: CreateUserLevelDto): Promise<UserLevelEntity> {
    return this.userLevelsRepository.save(input);
  }

  updateUserLevel(input: UpdateUserLevelDto): Promise<Partial<UserLevelEntity> | void> {
    return this.upsertUserLevel(input);
  }
}
