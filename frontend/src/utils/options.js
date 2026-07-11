const getOptionByValue = (options = [], value, fallback = null) => {
  return options.find((option) => option.value === value) || fallback;
};

const getOptionLabel = (options = [], value, fallback = value) => {
  return getOptionByValue(options, value)?.label || fallback;
};

const isValidOptionValue = (options = [], value) => {
  return options.some((option) => option.value === value);
};

const getValidOptionValue = (options = [], value, fallback = "") => {
  return isValidOptionValue(options, value) ? value : fallback;
};

const createSortValue = (sortBy, order) => {
  return `${sortBy}:${order}`;
};

const getSortOptionByValue = (options = [], value, fallback = null) => {
  return options.find((option) => option.value === value) || fallback;
};

const getSortOptionByFields = (
  options = [],
  sortBy,
  order,
  fallback = null,
) => {
  return (
    options.find((option) => {
      return option.sortBy === sortBy && option.order === order;
    }) || fallback
  );
};

export {
  getOptionByValue,
  getOptionLabel,
  isValidOptionValue,
  getValidOptionValue,
  createSortValue,
  getSortOptionByValue,
  getSortOptionByFields,
};
