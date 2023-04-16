import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { IPaginationQuery } from '../product-models/pagination.query.model';

export class PaginationQueryTransformerPipe
  implements PipeTransform<IPaginationQuery, IPaginationQuery>
{
  transform(
    value: IPaginationQuery,
    metadata: ArgumentMetadata,
  ): IPaginationQuery {
    const paginationQuery: IPaginationQuery = {
      searchNameTerm: value.searchNameTerm ?? null,
      sortBy: value.sortBy ?? 'createdAt',
      sortDirection: value.sortDirection ?? 'desc',
      pageNumber: value.pageNumber ?? 1,
      pageSize: value.pageSize ?? 10,
    };
    return paginationQuery;
  }
}
