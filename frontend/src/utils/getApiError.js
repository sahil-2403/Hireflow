const isTimeoutError = (error) => {
  return (
    error.code === "ECONNABORTED" ||
    error.message?.toLowerCase().includes("timeout")
  );
};

const getApiError = (error) => {
  if (isTimeoutError(error)) {
    const isUploadRequest = Boolean(error.config?._isUploadRequest);

    return {
      statusCode: null,
      message: isUploadRequest
        ? "Upload is taking longer than expected. Please wait a moment before trying again. If the upload finishes in the background, refresh the page to see the latest file."
        : "The request is taking longer than expected. Please try again.",
      errors: [],
    };
  }

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
