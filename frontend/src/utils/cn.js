//classname helper

const cn = (...values) => {
  return values
    .flatMap((value) => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value === "object") {
        return Object.entries(value)
          .filter(([, isEnabled]) => Boolean(isEnabled))
          .map(([className]) => className);
      }

      return [value];
    })
    .filter(Boolean)
    .join(" ");
};

export default cn;
