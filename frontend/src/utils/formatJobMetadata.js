const JOB_METADATA_LABELS = {
  "full-time": "Full time",
  "part-time": "Part time",
  contract: "Contract",
  internship: "Internship",

  onsite: "Onsite",
  remote: "Remote",
  hybrid: "Hybrid",

  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior level",
  lead: "Lead",
};

const formatJobMetadata = (value, fallback = "Unavailable") => {
  if (!value) {
    return fallback;
  }

  return JOB_METADATA_LABELS[value] || value;
};

export default formatJobMetadata;
