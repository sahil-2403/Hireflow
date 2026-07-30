import { useEffect, useState } from "react";

import {
  getMyApplicationSummary,
  listMyApplications,
} from "../../api/application.api";

import CandidateApplicationsList from "../../components/candidate/CandidateApplicationsList";
import CandidateApplicationsSummary from "../../components/candidate/CandidateApplicationsSummary";

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

const INITIAL_LIST_STATE = {
  status: "loading",
  applicationsData: null,
  errorMessage: "",
  successfulQuery: null,
};

const INITIAL_SUMMARY_STATE = {
  status: "loading",
  summary: null,
  errorMessage: "",
};

const CandidateApplicationsPage = () => {
  const [listState, setListState] = useState(INITIAL_LIST_STATE);

  const [summaryState, setSummaryState] = useState(INITIAL_SUMMARY_STATE);

  const [selectedStatus, setSelectedStatus] = useState("");

  const [page, setPage] = useState(1);

  const [listLoadAttempt, setListLoadAttempt] = useState(0);

  const [summaryLoadAttempt, setSummaryLoadAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const fetchApplications = async () => {
      const requestedQuery = {
        page,
        status: selectedStatus,
      };

      setListState((currentState) => ({
        ...currentState,
        status: "loading",
        errorMessage: "",
      }));

      try {
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

        setListState({
          status: "success",
          applicationsData: result.data,
          errorMessage: "",
          successfulQuery: requestedQuery,
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        /*
         * Keep the most recent successful
         * rows and query metadata visible.
         */
        setListState((currentState) => ({
          ...currentState,
          status: "error",
          errorMessage: normalizedError.message,
        }));
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
      setSummaryState((currentState) => ({
        ...currentState,
        status: "loading",
        errorMessage: "",
      }));

      try {
        const result = await getMyApplicationSummary();

        if (shouldIgnore) {
          return;
        }

        setSummaryState({
          status: "success",
          summary: result.data,
          errorMessage: "",
        });
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        /*
         * Preserve previously loaded summary
         * data if a refresh request fails.
         */
        setSummaryState((currentState) => ({
          ...currentState,
          status: "error",
          errorMessage: normalizedError.message,
        }));
      }
    };

    fetchApplicationSummary();

    return () => {
      shouldIgnore = true;
    };
  }, [summaryLoadAttempt]);

  const handleStatusChange = (nextStatus) => {
    setSelectedStatus(nextStatus);
    setPage(1);
  };

  const handlePreviousPage = () => {
    const displayedPage = listState.applicationsData?.pagination?.page ?? page;

    setPage(Math.max(displayedPage - 1, 1));
  };

  const handleNextPage = () => {
    const displayedPage = listState.applicationsData?.pagination?.page ?? page;

    setPage(displayedPage + 1);
  };

  return (
    <div className="grid gap-5">
      <PageHero
        title="My applications"
        description="Track submitted jobs, review current statuses, and open the original job details from one workspace."
      />

      <CandidateApplicationsSummary
        status={summaryState.status}
        summary={summaryState.summary}
        errorMessage={summaryState.errorMessage}
        onRetry={() =>
          setSummaryLoadAttempt((currentAttempt) => currentAttempt + 1)
        }
      />

      <CandidateApplicationsList
        status={listState.status}
        applicationsData={listState.applicationsData}
        errorMessage={listState.errorMessage}
        selectedStatus={selectedStatus}
        successfulQuery={listState.successfulQuery}
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
