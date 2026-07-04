export interface PageParams {
  page: number
  limit: number
  skip: number
}

export function paginate(page?: number, limit?: number): PageParams {
  const resolvedPage = page ?? 1
  const resolvedLimit = limit ?? 20
  return {
    page: resolvedPage,
    limit: resolvedLimit,
    skip: (resolvedPage - 1) * resolvedLimit,
  }
}
