import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { IPaginationQueryApiDTO } from '../product-models/pagination.query.dto';

export class PaginationQueryTransformerPipe
  implements PipeTransform<IPaginationQueryApiDTO, IPaginationQueryApiDTO>
{
  transform(
    value: IPaginationQueryApiDTO,
    metadata: ArgumentMetadata,
  ): IPaginationQueryApiDTO {
    const paginationQuery: IPaginationQueryApiDTO = {
      searchNameTerm: value.searchNameTerm ?? null,
      sortBy: value.sortBy ?? 'createdAt',
      sortDirection: value.sortDirection ?? 'desc',
      pageNumber: value.pageNumber ?? 1,
      pageSize: value.pageSize ?? 10,
    };
    return paginationQuery;
  }
}
