import { FilterQuery, Model } from 'mongoose';

type DocumentPaginationModel<T> = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type PaginationQueryType = {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};

export type FilterType = {
  property: string;
  value: string;
}[];

type FilterOptionsType = {
  multipleFieldsOption: '$or' | '$and';
  regexOption: 'i' | 'm' | 'x' | 's';
};

/*функция для возвращения документов из базы данных с пагинацией.
 первым параметром передается квери конфиг
 вторым параметром передается модель в которой нужно что то найти
 третьим массив объектов со свойствами и значениями которые нужно подставить в запрос
 четвертым опции. если не передано ничего, то дефолтом подставится $or и regex: 'i' если фильтров 2 или больше
 содержит также generic.
 generic<T> отвечает за тип возвращаемых сущностей (нужно передать тип документов. например BlogDocument)
*/
export const getDocumentsWithPagination = async <T>({
  query,
  model,
  rawFilter = [],
  filterOptions = {
    multipleFieldsOption: '$or',
    regexOption: 'i',
  },
  lean = false,
}: {
  query: PaginationQueryType;
  model: Model<any>;
  rawFilter?: FilterType;
  filterOptions?: FilterOptionsType;
  lean?: boolean;
}): Promise<DocumentPaginationModel<T>> => {
  const getCorrectSortQuery = (): { [sortByProp: string]: number } => {
    let sortDirection: 1 | -1 = -1;
    if (query.sortDirection === 'asc') sortDirection = 1;
    if (query.sortDirection === 'desc') sortDirection = -1;
    const sortQuery = { [query.sortBy]: sortDirection };
    return sortQuery;
  };
  const getCorrectFilter = (): FilterQuery<any> => {
    let filter: FilterQuery<any> = {};
    if (rawFilter.length === 1) {
      const filterProperty: string = rawFilter[0].property;
      const filterValue: string = rawFilter[0].value;
      filter = {
        [filterProperty]: {
          $regex: filterValue,
          $options: filterOptions.regexOption,
        },
      };
    } else if (rawFilter.length > 1) {
      const chosenFindWay: '$or' | '$and' = filterOptions.multipleFieldsOption;
      filter = { [chosenFindWay]: [] };
      const arrayWithQuery: {
        [prop: string]: { $regex: string; $options: 'i' | 'm' | 'x' | 's' };
      }[] = rawFilter.map((propAndValue) => {
        const currentProperty = propAndValue.property;
        const currentValue = propAndValue.value;
        return {
          [currentProperty]: {
            $regex: currentValue,
            $options: filterOptions.regexOption,
          },
        };
      });
      filter[chosenFindWay] = arrayWithQuery;
    }
    return filter;
  };
  const mappedRegexFilter: FilterQuery<any> = getCorrectFilter();
  console.log(mappedRegexFilter);
  const sortQuery = getCorrectSortQuery();
  const howMuchToSkip: number = query.pageSize * (query.pageNumber - 1);
  const documentsTotalCount: number = await model.countDocuments(
    mappedRegexFilter,
  );
  let documentsWithPagination: T[];
  if (lean) {
    documentsWithPagination = await model
      .find(
        mappedRegexFilter,
        { _id: false },
        { limit: query.pageSize, skip: howMuchToSkip, sort: sortQuery },
      )
      .lean();
  } else {
    documentsWithPagination = await model.find(
      mappedRegexFilter,
      { _id: false },
      { limit: query.pageSize, skip: howMuchToSkip, sort: sortQuery },
    );
  }
  const pagesCount: number = Math.ceil(documentsTotalCount / query.pageSize);
  const paginationResult: DocumentPaginationModel<T> = {
    pagesCount,
    page: Number(query.pageNumber),
    pageSize: Number(query.pageSize),
    totalCount: Number(documentsTotalCount),
    items: documentsWithPagination,
  };
  return paginationResult;
};
