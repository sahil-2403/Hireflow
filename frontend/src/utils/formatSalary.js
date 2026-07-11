const formatSalary = (
  job,
  { fallback = "Salary not disclosed", defaultCurrency = "INR" } = {},
) => {
  if (!job?.isSalaryVisible) {
    return fallback;
  }

  const { salaryMin, salaryMax } = job;

  if (salaryMin == null && salaryMax == null) {
    return fallback;
  }

  const currency = job.salaryCurrency || defaultCurrency;

  if (salaryMin != null && salaryMax != null) {
    return `${currency} ${salaryMin} - ${salaryMax}`;
  }

  if (salaryMin != null) {
    return `${currency} ${salaryMin}+`;
  }

  return `Up to ${currency} ${salaryMax}`;
};

export default formatSalary;
