const isCompanyProfileMissingError = (error) => {
  return (
    error?.statusCode === 404 &&
    error?.message?.toLowerCase() === "company profile not found"
  );
};

export default isCompanyProfileMissingError;
