const getApiError = (error) => {
  if (error.response) {
    return {
      statusCode: error.response.data?.statusCode ?? error.response.status,

      message:
        error.response.data?.message ?? "The request could not be completed.",

      errors: error.response.data?.errors ?? [],
    };
  }

  if (error.request) {
    return {
      statusCode: null,
      message: "Unable to connect to the server. Please check your connection.",
      errors: [],
    };
  }

  return {
    statusCode: null,
    message: error.message ?? "An unexpected error occurred.",
    errors: [],
  };
};

export default getApiError;
