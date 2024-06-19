import { BaseEntity, Page } from '@/db/model';
import { ServiceError, ServiceErrorCode, toServiceError } from '@/shared/error';
import { toOption } from '@/shared/util';
import { Ok, Option, Result } from '@sniptt/monads';
import { ModelType } from '@typegoose/typegoose/lib/types';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { duplicateKeyErrorCode } from '@/db/index';
import { PageDto } from '@/shared/controller/model';
import { Inject } from '@nestjs/common';
import { Pager } from '@/db/pager';

export abstract class BaseRepository<Entity extends BaseEntity> {
  @Inject()
  protected pager: Pager;

  protected constructor(protected model: ModelType<Entity>) {}

  public async save(
    entity: Entity
  ): Promise<Result<Entity, ServiceError>> {
    try {
      const result = (await this.model.create<Entity>(entity)).toObject({ virtuals: true });
      return Ok(result);
    } catch (e) {
      if (e.code === duplicateKeyErrorCode) {
        return toServiceError(e, ServiceErrorCode.ENTITY_ALREADY_EXISTS)
      }
      return toServiceError(e);
    }
  }

  public async saveAll(
    entities: Entity[]
  ): Promise<Result<Entity[], ServiceError>> {
    try {
      const result = (await this.model.create<Entity>(entities))?.map(it => it.toObject({ virtuals: true }));
      return Ok(result);
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async exists(
    criteria: FilterQuery<Entity>
  ): Promise<Result<boolean, ServiceError>> {
    try {
      const result = await this.model.exists(criteria);
      return Ok(!!result);
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async findById(
    id: string,
    fields?: Fields<Entity>
  ): Promise<Result<Option<Readonly<Entity>>, ServiceError>> {
    try {
      const result = await this.model.findById(id, fields).lean<Entity>({ virtuals: true }).exec();
      return Ok(toOption<Entity>(result));
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async findOne(
    criteria: FilterQuery<Entity>,
    fields?: Fields<Entity>
  ): Promise<Result<Option<Readonly<Entity>>, ServiceError>> {
    try {
      const result = await this.model.findOne(criteria, fields).lean<Entity>({ virtuals: true }).exec();
      return Ok(toOption<Entity>(result));
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async findAll(
    page: PageDto,
    criteria: FilterQuery<Entity>,
    fields?: Fields<Entity>
  ): Promise<Result<Page<Readonly<Entity>>, ServiceError>> {
    try {
      const result = await this.pager.paginate('createdAt', page, this.model, criteria, fields);
      return Ok(result);
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async updateOne(
    criteria: FilterQuery<Entity>,
    update: UpdateQuery<Entity>
  ): Promise<Result<Option<Readonly<Entity>>, ServiceError>> {
    try {
      const result = await this.model
        .findOneAndUpdate(criteria, update, { returnDocument: 'after' })
        .lean<Entity>({ virtuals: true })
        .exec();

      return Ok(toOption<Entity>(result));
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async updateById(
    id: string,
    update: UpdateQuery<Entity>
  ): Promise<Result<Option<Readonly<Entity>>, ServiceError>> {
    try {
      const result = await this.model
        .findByIdAndUpdate(id, update, { returnDocument: 'after' })
        .lean<Entity>({ virtuals: true })
        .exec();

      return Ok(toOption<Entity>(result));
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async deleteOne(
    criteria: FilterQuery<Entity>
  ): Promise<Result<boolean, ServiceError>> {
    try {
      const result = await this.model.deleteOne(criteria).exec() as DeleteResult;
      return Ok(!!result?.deletedCount);
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async deleteMany(
    criteria: FilterQuery<Entity>
  ): Promise<Result<number, ServiceError>> {
    try {
      const result = await this.model.deleteMany(criteria).exec() as DeleteResult;
      return Ok(result?.deletedCount);
    } catch (e) {
      return toServiceError(e);
    }
  }

  public async deleteById(
    id: string
  ): Promise<Result<boolean, ServiceError>> {
    try {
      const result = await this.model.findByIdAndDelete(id).lean<Entity>().exec();
      return Ok(!!result);
    } catch (e) {
      return toServiceError(e);
    }
  }
}

/**
 * Restrict projections to allow only the fields on the queried object
 * Ensuring only valid projections are provided (or a compilation error is shown)
 */
type Fields<Entity extends BaseEntity> = { [P in keyof Entity]?: number };

interface DeleteResult {
  acknowledged: boolean;
  deletedCount: number;
}
