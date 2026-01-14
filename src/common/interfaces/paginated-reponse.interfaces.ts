export interface PaginationMetaFormat {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationResponse<T> {
  Items: T[];
  meta: PaginationMetaFormat;
}
