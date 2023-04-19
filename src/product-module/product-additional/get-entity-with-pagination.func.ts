import { FilterQuery, Model } from 'mongoose';

interface IDocumentPaginationModel<T> {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}

export interface IPaginationQuery {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
}

type FilterWithRegexType = {
  [entityProp: string]: { $regex: string; $options: string };
} & FilterQuery<any>;

type MultipleFilterWithRegexType = {
  $or: { [entityProp: string]: { $regex: string; $options: string } }[];
} & FilterQuery<any>;

/*функция для возвращения документов из базы данных с пагинацией.
 первым параметром передается квери конфиг
 вторым параметром передается модель в которой нужно что то найти
 содержит также два generic.
 первый generic<T> отвечает за тип возвращаемых сущностей (нужно передать тип документов. например BlogDocument)
 второй generic<R> отвечает за тип передаваемой модели с помощью которой будет проводиться поиск, нужно передать
 например BlogSchema (тип модели)*/
export const getDocumentsWithPagination = async <T, R>(
  query: IPaginationQuery,
  model: Model<R>,
  regexFilter: { [entityProp: string]: string } = {},
): Promise<IDocumentPaginationModel<T>> => {
  const countRegexFilterValues: number = Object.entries(regexFilter).length;
  const regexFilterEntries: [string, string][] = Object.entries(regexFilter);
  let mappedRegexFilter: FilterWithRegexType | MultipleFilterWithRegexType;
  let sortDirection: 1 | -1 = -1;
  if (query.sortDirection === 'asc') sortDirection = 1;
  const sortQuery = { [query.sortBy]: sortDirection };
  if (countRegexFilterValues === 0) {
    mappedRegexFilter = {};
  } else if (countRegexFilterValues === 1) {
    mappedRegexFilter = {
      [regexFilterEntries[0][0]]: {
        $regex: regexFilterEntries[0][1],
        $options: 'i',
      },
    };
  } else if (countRegexFilterValues > 1) {
    mappedRegexFilter = { $or: [] };
    for (const keyAndValue of regexFilterEntries) {
      const currentProperty = keyAndValue[0];
      const currentValue = keyAndValue[1];
      mappedRegexFilter.$or.push({
        [currentProperty]: { $regex: currentValue, $options: 'i' },
      });
    }
  }
  const howMuchToSkip: number = query.pageSize * (query.pageNumber - 1);
  const documentsTotalCount: number = await model.countDocuments();
  const documentsWithPagination: T[] = await model.find(
    mappedRegexFilter,
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
