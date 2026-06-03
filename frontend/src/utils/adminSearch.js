const normalizeVietnameseText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

export const normalizeSearchText = (value = "") =>
  normalizeVietnameseText(value)
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

export const normalizeEmailSearchText = (value = "") =>
  value
    .toString()
    .replace(/\s+/g, "")
    .toLowerCase()
    .trim();

export const filterBySearchTerm = (
  items,
  searchTerm,
  getValue,
  normalize = normalizeSearchText
) => {
  const normalizedSearchTerm = normalize(searchTerm);
  const isWhitespaceOnlySearch =
    searchTerm.length > 0 && normalizedSearchTerm.length === 0;

  if (isWhitespaceOnlySearch) {
    return {
      normalizedSearchTerm,
      filteredItems: items,
      hasNoResults: false,
    };
  }

  const filteredItems = items.filter((item) =>
    normalize(getValue(item) ?? "").includes(normalizedSearchTerm)
  );

  return {
    normalizedSearchTerm,
    filteredItems,
    hasNoResults:
      normalizedSearchTerm.length > 0 && filteredItems.length === 0,
  };
};
