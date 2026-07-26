import { useEffect, useRef, useState } from "react";

import {
  Eye,
  FileText,
  LoaderCircle,
  Upload,
  UserRoundPlus,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  getMyCandidateProfile,
  uploadCandidateResume,
  viewCandidateResume,
} from "../../api/candidate.api";

import CandidateResumeInsightsCard from "../../components/ai/CandidateResumeInsightsCard";

import CandidateResumePageSkeleton from "../../components/loading/CandidateResumePageSkeleton";

import Button from "../../components/ui/Button";

import { Card, CardBody, CardHeader } from "../../components/ui/Card";

import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import Pill from "../../components/ui/Pill";
import SectionError from "../../components/ui/SectionError";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";
import openPdfBlob from "../../utils/openPdfBlob";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (!bytes) {
    return "0 KB";
  }

  const sizeInKb = bytes / 1024;

  if (sizeInKb < 1024) {
    return `${Math.round(sizeInKb)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(2)} MB`;
};

const ResumeFileManager = ({
  hasResume,
  selectedFile,
  fileError,
  fileInputRef,
  isUploading,
  isOpeningResume,
  onFileChange,
  onViewResume,
  onSubmit,
}) => {
  const descriptionId = "resume-file-description";

  const errorId = "resume-file-error";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={[
              "grid h-11 w-11",
              "shrink-0 place-items-center",
              "rounded-xl",

              hasResume
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700",
            ].join(" ")}
          >
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold leading-7 text-slate-950">
                Current resume
              </h2>

              <Pill
                variant={hasResume ? "emerald" : "amber"}
                size="xs"
                className="normal-case"
              >
                {hasResume ? "Uploaded" : "Not uploaded"}
              </Pill>
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {hasResume
                ? "Your PDF is available for job applications and AI Resume Insights."
                : "Upload a PDF before applying or generating Resume Insights."}
            </p>
          </div>
        </div>

        {hasResume && (
          <Button
            type="button"
            variant="secondary"
            className="w-full shrink-0 sm:w-auto"
            disabled={isOpeningResume}
            onClick={onViewResume}
          >
            {isOpeningResume ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}

            {isOpeningResume ? "Opening..." : "View resume"}
          </Button>
        )}
      </CardHeader>

      <CardBody>
        <form onSubmit={onSubmit} noValidate>
          <div>
            <h3 className="text-base font-semibold leading-6 text-slate-950">
              {hasResume ? "Replace resume" : "Upload resume"}
            </h3>

            <p
              id={descriptionId}
              className="mt-1 text-sm leading-6 text-slate-600"
            >
              Select one PDF file up to 5 MB.
              {hasResume
                ? " A successful upload replaces the current file."
                : ""}
            </p>
          </div>

          <input
            ref={fileInputRef}
            id="resume"
            type="file"
            accept=".pdf,application/pdf"
            disabled={isUploading}
            aria-invalid={Boolean(fileError)}
            aria-describedby={[descriptionId, fileError ? errorId : ""]
              .filter(Boolean)
              .join(" ")}
            onChange={onFileChange}
            className="sr-only"
          />

          <label
            htmlFor="resume"
            aria-disabled={isUploading}
            className={[
              "mt-4 flex min-w-0",
              "cursor-pointer items-center gap-3",
              "rounded-2xl border border-dashed p-4",
              "transition-colors",

              fileError
                ? "border-red-300 bg-red-50/40"
                : "border-blue-200 bg-blue-50/40 hover:bg-blue-50",

              isUploading ? "pointer-events-none opacity-60" : "",

              "focus-within:outline-none",
              "focus-within:ring-2",
              "focus-within:ring-blue-500",
            ].join(" ")}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <p
                title={selectedFile?.name || undefined}
                className={[
                  "truncate text-sm font-medium",

                  selectedFile ? "text-slate-950" : "text-blue-700",
                ].join(" ")}
              >
                {selectedFile ? selectedFile.name : "Choose a PDF resume"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} · PDF`
                  : "PDF only · Maximum 5 MB"}
              </p>
            </div>
          </label>

          {fileError && (
            <p
              id={errorId}
              role="alert"
              className="mt-2 text-xs leading-5 text-red-600"
            >
              {fileError}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}

              {isUploading
                ? "Uploading..."
                : hasResume
                  ? "Replace resume"
                  : "Upload resume"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

const MissingProfileState = () => {
  return (
    <EmptyState
      icon={UserRoundPlus}
      title="Create your candidate profile"
      description="Your candidate profile is required before you can upload and manage a resume."
      action={
        <Button as={Link} to="/candidate/profile">
          Create profile
        </Button>
      }
    />
  );
};

const CandidateResumePage = () => {
  const fileInputRef = useRef(null);

  const [pageStatus, setPageStatus] = useState("loading");

  const [profile, setProfile] = useState(null);

  const [pageErrorMessage, setPageErrorMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [fileError, setFileError] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  const [isOpeningResume, setIsOpeningResume] = useState(false);

  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let shouldIgnore = false;

    const loadProfile = async () => {
      try {
        setPageStatus("loading");

        setPageErrorMessage("");

        const result = await getMyCandidateProfile();

        if (shouldIgnore) {
          return;
        }

        setProfile(result.data);
        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (normalizedError.statusCode === 404) {
          setProfile(null);

          setPageStatus("missing-profile");

          return;
        }

        setPageErrorMessage(normalizedError.message);

        setPageStatus("error");
      }
    };

    loadProfile();

    return () => {
      shouldIgnore = true;
    };
  }, [loadAttempt]);

  const handleRetryLoad = () => {
    setPageErrorMessage("");
    setPageStatus("loading");

    setLoadAttempt((currentAttempt) => currentAttempt + 1);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setSelectedFile(null);

      setFileError("Only PDF resume files are allowed.");

      event.target.value = "";

      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setSelectedFile(null);

      setFileError("Resume file must be 5 MB or smaller.");

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFileError("");

    if (!selectedFile) {
      setFileError("Select a PDF resume before uploading.");

      return;
    }

    try {
      setIsUploading(true);

      const result = await uploadCandidateResume(selectedFile);

      setProfile(result.data);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      notify.success(result.message || "Resume uploaded successfully.");
    } catch (error) {
      const normalizedError = getApiError(error);

      notify.error("Could not upload resume", {
        description: normalizedError.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewResume = async () => {
    try {
      setIsOpeningResume(true);

      const resumeBlob = await viewCandidateResume();

      openPdfBlob(resumeBlob);
    } catch (error) {
      const normalizedError = getApiError(error);

      notify.error("Could not open resume", {
        description: normalizedError.message,
      });
    } finally {
      setIsOpeningResume(false);
    }
  };

  const isLoading = pageStatus === "loading";

  const isMissingProfile = pageStatus === "missing-profile";

  const hasLoadError = pageStatus === "error";

  const isReady = pageStatus === "ready";

  const hasResume = Boolean(profile?.resumeUrl);

  return (
    <div className="grid gap-5">
      <PageHero
        title="Manage your resume"
        description="Upload the PDF used for applications and generate structured AI Resume Insights."
      />

      {isLoading && <CandidateResumePageSkeleton />}

      {isMissingProfile && <MissingProfileState />}

      {hasLoadError && (
        <SectionError
          title="Could not load resume details"
          message={pageErrorMessage}
          onRetry={handleRetryLoad}
        />
      )}

      {isReady && (
        <>
          <ResumeFileManager
            hasResume={hasResume}
            selectedFile={selectedFile}
            fileError={fileError}
            fileInputRef={fileInputRef}
            isUploading={isUploading}
            isOpeningResume={isOpeningResume}
            onFileChange={handleFileChange}
            onViewResume={handleViewResume}
            onSubmit={handleSubmit}
          />

          <CandidateResumeInsightsCard
            hasResume={hasResume}
            resumeUrl={profile?.resumeUrl}
          />
        </>
      )}
    </div>
  );
};

export default CandidateResumePage;
