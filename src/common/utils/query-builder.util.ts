const EXCLUDED_QUERY_FIELDS = ['searchTerm', 'sort', 'fields', 'page', 'limit'];

export type ParsedQueryOptions = {
  where: Record<string, unknown>;
  orderBy: Record<string, 'asc' | 'desc'> | undefined;
  select: Record<string, boolean> | undefined;
  page: number;
  limit: number;
  skip: number;
  searchTerm: string;
};

export function parseQueryOptions(
  query: Record<string, string | undefined>,
): ParsedQueryOptions {
  const where: Record<string, unknown> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (!value || EXCLUDED_QUERY_FIELDS.includes(key)) {
      return;
    }
    where[key] = value;
  });

  const searchTerm = query.searchTerm ?? '';
  const sort = query.sort ?? '-createdAt';
  const direction = sort.startsWith('-') ? 'desc' : 'asc';
  const sortField = sort.replace(/^-/, '');

  const fields = query.fields
    ? query.fields
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean)
        .reduce<Record<string, boolean>>((acc, field) => {
          acc[field] = true;
          return acc;
        }, {})
    : undefined;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  return {
    where,
    orderBy: sortField ? { [sortField]: direction } : undefined,
    select: fields,
    page,
    limit,
    skip,
    searchTerm,
  };
}
