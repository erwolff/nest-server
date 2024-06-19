import { Page } from '@/db/model';
import { PageDto, toQueryOptions } from '@/shared/controller/model/page.dto';
import { ServiceError, typedError } from '@/shared/error';
import { Injectable } from '@nestjs/common';
import { None, Ok, Result } from '@sniptt/monads';
import { ModelType } from '@typegoose/typegoose/lib/types';
import _ from 'lodash';
import { FilterQuery } from 'mongoose';

@Injectable()
export class Pager {
  /**
   * Runs a pageable find query with the supplied
   * criteria and returns a Page object with the
   * result
   */
  public async paginate<Entity>(
    sort: string,
    pageDto: PageDto,
    model: ModelType<Entity>,
    criteria: FilterQuery<Entity>,
    projection?: any
  ): Promise<Page<Readonly<Entity>>> {
    const total = await model.countDocuments(criteria).exec();
    const content = await model.find(criteria, projection, toQueryOptions(pageDto, sort))
      .lean<Entity[]>({ virtuals: true })
      .exec();
    const { page, limit, order } = pageDto;
    return new Page<Entity>(page, limit, sort, order, total, content);
  }

  /**
   * Performs the action supplied by the consumer on each individual
   * result from the supplied query using the supplied pageDto
   *
   * @param page
   * @param query
   * @param consumer
   */
  public async forEach<Entity>(
    page: PageDto,
    query: (page: PageDto) => Promise<Result<Page<Readonly<Entity>>, ServiceError>>,
    consumer: (entity: Entity) => Promise<void>
  ): Promise<Result<typeof None, ServiceError>> {
    return await this.page(
      page,
      query,
      async (entities: Entity[]): Promise<void> => {
        for (const entity of entities) {
          await consumer(entity);
        }
      }
    );
  }

  /**
   * Performs the action supplied by the consumer on each page of results
   * from the supplied query using the supplied pageDto
   *
   * @param page
   * @param query
   * @param consumer
   */
  public async page<Entity>(
    page: PageDto,
    query: (page: PageDto) => Promise<Result<Page<Readonly<Entity>>, ServiceError>>,
    consumer: (entities: Entity[]) => Promise<void>
  ): Promise<Result<typeof None, ServiceError>> {
    let queryResult = await query(page);
    if (queryResult.isErr()) {
      return typedError(queryResult);
    }
    let resultPage = queryResult.unwrap();
    await this.consume(resultPage, consumer);
    while (resultPage.hasNext()) {
      queryResult = await query(resultPage.next());
      if (queryResult.isErr()) {
        return typedError(queryResult);
      }
      resultPage = queryResult.unwrap();
      await this.consume(resultPage, consumer);
    }
    return Ok(None);
  }

  /**
   * Performs the action supplied by the consumer on the supplied page
   * of results (if the page has content)
   *
   * @param resultPage
   * @param consumer
   * @private
   */
  private async consume<Entity>(
    resultPage: Page<Readonly<Entity>>,
    consumer: (entities: Entity[]) => Promise<void>
  ): Promise<void> {
    if (!_.isEmpty(resultPage.content)) {
      await consumer(resultPage.content);
    }
  }
}
