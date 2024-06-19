import { PageDto } from '@/shared/controller/model';

export class Page<T> {
  constructor(
    public page: number,
    public limit: number,
    public sort: string,
    public order: string,
    public total: number,
    public content: T[]
  ) {
  }

  public hasNext(): boolean {
    return this.page * this.limit < this.total;
  }

  public next(): PageDto {
    return new PageDto(
      this.page + 1,
      this.limit,
      this.order
    );
  }

  /**
   * Returns a new page with the content
   * mapped by the supplied mapping function
   *
   * @param mappingFn
   */
  public map<U>(mappingFn: (data: T) => U): Page<U> {
    return new Page(
      this.page,
      this.limit,
      this.sort,
      this.order,
      this.total,
      this.content.map(mappingFn)
    );
  }

  /**
   * Returns a new page with the content
   * asynchronously mapped by the supplied
   * mapping function
   *
   * @param mappingFn
   */
  public async mapAsync<U>(mappingFn: (data: T) => Promise<U>): Promise<Page<U>> {
    const mappedContent = await Promise.all(this.content.map(mappingFn));
    return new Page(
      this.page,
      this.limit,
      this.sort,
      this.order,
      this.total,
      mappedContent
    );
  }
}
