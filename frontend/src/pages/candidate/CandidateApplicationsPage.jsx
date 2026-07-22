import { useEffect, useMemo, useState } from "react";

import { BriefcaseBusiness } from "lucide-react";

import { Link } from "react-router-dom";

import { listMyApplications } from "../../api/application.api";

import CandidateApplicationsList from "../../components/candidate/CandidateApplicationsList";
import CandidateApplicationsSummary from "../../components/candidate/CandidateApplicationsSummary";

import Button from "../../components/ui/Button";
import PageHero from "../../components/ui/PageHero";

import getApiError from "../../utils/getApiError";

const APPLICATION_STATUS_OPTIONS = [
  {
    label: "All statuses",
    value: "",
  },
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

const SUMMARY_FETCH_LIMIT = 100;

const getStatusCount = (applications, status) => {
  return applications.filter((application) => application.status === status)
    .length;
};

const CandidateApplicationsPage = () => {
  const [status, setStatus] = useState("loading");

  const [applicationsData, setApplicationsData] = useState(null);

  const [summaryStatus, setSummaryStatus] = useState("loading");

  const [summaryApplications, setSummaryApplications] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const [summaryErrorMessage, setSummaryErrorMessage] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [page, setPage] = useState(1);

  const [listLoadAttempt, setListLoadAttempt] = useState(0);

  const [summaryLoadAttempt, setSummaryLoadAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplications = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const params = {
          page,
          limit: 10,
        };

        if (selectedStatus) {
          params.status = selectedStatus;
        }

        const result = await listMyApplications(params);

        if (shouldIgnore) {
          return;
        }

        setApplicationsData(result.data);

        setStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        /*
         * Keep already-loaded rows
         * visible if a filter or
         * pagination refresh fails.
         */
        setStatus("error");
      }
    };

    fetchApplications();

    return () => {
      shouldIgnore = true;
    };
  }, [page, selectedStatus, listLoadAttempt]);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplicationSummary = async () => {
      try {
        setSummaryStatus("loading");

        setSummaryErrorMessage("");

        const result = await listMyApplications({
          page: 1,

          limit: SUMMARY_FETCH_LIMIT,
        });

        if (shouldIgnore) {
          return;
        }

        setSummaryApplications(result.data?.applications ?? []);

        setSummaryStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        setSummaryErrorMessage(normalizedError.message);

        setSummaryApplications([]);

        setSummaryStatus("error");
      }
    };

    fetchApplicationSummary();

    return () => {
      shouldIgnore = true;
    };
  }, [summaryLoadAttempt]);

  const summary = useMemo(
    () => ({
      total: summaryApplications.length,

      screening: getStatusCount(summaryApplications, "screening"),

      interview: getStatusCount(summaryApplications, "interview"),

      offers:
        getStatusCount(summaryApplications, "offer") +
        getStatusCount(summaryApplications, "hired"),
    }),
    [summaryApplications],
  );

  const handleStatusChange = (nextStatus) => {
    setSelectedStatus(nextStatus);

    setPage(1);
  };

  const handlePreviousPage = () => {
    setPage((currentPage) => Math.max(currentPage - 1, 1));
  };

  const handleNextPage = () => {
    setPage((currentPage) => currentPage + 1);
  };

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Candidate applications"
        title="My applications"
        description="Track submitted jobs, review current statuses, and open the original job details from one workspace."
        actions={
          <Button as={Link} to="/jobs">
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
            Browse jobs
          </Button>
        }
      />

      <CandidateApplicationsSummary
        status={summaryStatus}
        summary={summary}
        errorMessage={summaryErrorMessage}
        onRetry={() =>
          setSummaryLoadAttempt((currentAttempt) => currentAttempt + 1)
        }
      />

      <CandidateApplicationsList
        status={status}
        applicationsData={applicationsData}
        errorMessage={errorMessage}
        selectedStatus={selectedStatus}
        statusOptions={APPLICATION_STATUS_OPTIONS}
        onStatusChange={handleStatusChange}
        onRetry={() =>
          setListLoadAttempt((currentAttempt) => currentAttempt + 1)
        }
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />
    </div>
  );
};

export default CandidateApplicationsPage;
