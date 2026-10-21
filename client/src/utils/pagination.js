export function paginateItems(items, requestedPage, pageSize = 10) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (page - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    page,
    totalPages,
    firstItem: totalItems ? startIndex + 1 : 0,
    lastItem: Math.min(startIndex + pageSize, totalItems),
    totalItems,
  };
}
