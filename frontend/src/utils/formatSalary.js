const salaryFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const formatSalaryAmount = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  return salaryFormatter.format(numericValue);
};

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
    return `${currency} ${formatSalaryAmount(
      salaryMin,
    )} – ${formatSalaryAmount(salaryMax)}`;
  }

  if (salaryMin != null) {
    return `${currency} ${formatSalaryAmount(salaryMin)}+`;
  }

  return `Up to ${currency} ${formatSalaryAmount(salaryMax)}`;
};

export default formatSalary;
