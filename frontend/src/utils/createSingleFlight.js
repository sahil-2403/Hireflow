const createSingleFlight = (operation) => {
  if (typeof operation !== "function") {
    throw new TypeError("Single-flight operation must be a function");
  }

  let activePromise = null;

  return (...args) => {
    if (!activePromise) {
      activePromise = Promise.resolve()
        .then(() => operation(...args))
        .finally(() => {
          activePromise = null;
        });
    }

    return activePromise;
  };
};

export default createSingleFlight;
