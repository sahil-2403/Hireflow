const APPLICATION_STATUSES = [
  {
    label: "Applied",
    value: "applied",
  },
  {
    label: "Screening",
    value: "screening",
  },
  {
    label: "Interview",
    value: "interview",
  },
  {
    label: "Offer",
    value: "offer",
  },
  {
    label: "Hired",
    value: "hired",
  },
  {
    label: "Rejected",
    value: "rejected",
  },
];

const APPLICATION_STATUS_FILTERS = [
  {
    label: "All statuses",
    value: "",
  },
  ...APPLICATION_STATUSES,
];

const NEXT_APPLICATION_STATUSES = {
  applied: ["screening", "rejected"],
  screening: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

const getApplicationStatusLabel = (status) => {
  const option = APPLICATION_STATUSES.find((item) => item.value === status);

  return option?.label || status;
};

export {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_FILTERS,
  NEXT_APPLICATION_STATUSES,
  getApplicationStatusLabel,
};
