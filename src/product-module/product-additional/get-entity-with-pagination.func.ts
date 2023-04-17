import { IPaginationQueryApiDTO } from '../product-dto/pagination.query.dto';
import { Model } from 'mongoose';

interface IDocumentPaginationModel<T> {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}

/*функция для возвращения документов из базы данных с пагинацией.
 первым параметром передается квери конфиг
 вторым параметром передается модель в которой нужно что то найти
 содержит также два generic.
 первый generic<T> отвечает за тип возвращаемых сущностей (нужно передать тип документов. например BlogDocument)
 второй generic<R> отвечает за тип передаваемой модели с помощью которой будет проводиться поиск*/
export const getDocumentsWithPagination = async <T, R>(
  query: IPaginationQueryApiDTO,
  model: Model<R>,
  findField = 'name',
): Promise<IDocumentPaginationModel<T>> => {
  let filter = {};
  let sortDirection: 1 | -1 = -1;
  if (query.sortDirection === 'asc') sortDirection = 1;
  const sortQuery = { [query.sortBy]: sortDirection };
  if (query.searchNameTerm)
    filter = { [findField]: { $regex: query.searchNameTerm, $options: 'i' } };
  const howMuchToSkip: number = query.pageSize * (query.pageNumber - 1);
  const documentsTotalCount: number = await model.countDocuments(filter);
  const documentsWithPagination: T[] = await model.find(
    filter,
    { _id: false },
    { limit: query.pageSize, skip: howMuchToSkip, sort: sortQuery },
  );
  const pagesCount: number = Math.ceil(documentsTotalCount / query.pageSize);
  const paginationResult: IDocumentPaginationModel<T> = {
    pagesCount,
    page: Number(query.pageNumber),
    pageSize: Number(query.pageSize),
    totalCount: Number(documentsTotalCount),
    items: documentsWithPagination,
  };
  return paginationResult;
};
