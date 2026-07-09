const isCompanyOwnerProfileMissingError = (error) => {
  return (
    error?.statusCode === 404 &&
    error?.message?.toLowerCase() === "company owner profile not found"
  );
};

export default isCompanyOwnerProfileMissingError;