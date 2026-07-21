import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  LoaderCircle,
  MapPin,
  Tags,
  Upload,
  UserRound,
  UserRoundPlus,
} from "lucide-react";

import {
  getMyCandidateProfile,
  uploadCandidateResume,
  viewCandidateResume,
} from "../../api/candidate.api";

import getApiError from "../../utils/getApiError";
import notify from "../../utils/notify";
import openPdfBlob from "../../utils/openPdfBlob";

import CandidateResumeInsightsCard from "../../components/ai/CandidateResumeInsightsCard";

import CandidateResumePageSkeleton from "../../components/loading/CandidateResumePageSkeleton";

import SectionError from "../../components/ui/SectionError";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const PRIMARY_BUTTON_CLASS_NAME = [
  "inline-flex min-h-10",
  "items-center justify-center",
  "gap-2 rounded-lg",
  "bg-blue-600 px-4 py-2.5",
  "text-sm font-medium text-white",
  "transition",
  "hover:bg-blue-700",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-blue-500",
  "focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed",
  "disabled:opacity-60",
].join(" ");

const SECONDARY_BUTTON_CLASS_NAME = [
  "inline-flex min-h-10",
  "items-center justify-center",
  "gap-2 rounded-lg",
  "border border-slate-200",
  "bg-white px-4 py-2.5",
  "text-sm font-medium text-slate-700",
  "transition",
  "hover:bg-slate-50",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-blue-500",
  "focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed",
  "disabled:opacity-60",
].join(" ");

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

const getReadinessItems = (profile, hasResume) => {
  return [
    {
      label: "Candidate profile",
      isComplete: Boolean(profile),
      description: "Create your candidate profile before managing a resume.",
      icon: UserRound,
    },
    {
      label: "Resume uploaded",
      isComplete: hasResume,
      description: "Upload a PDF resume before applying to jobs.",
      icon: FileText,
    },
    {
      label: "Skills added",
      isComplete: Array.isArray(profile?.skills) && profile.skills.length > 0,
      description: "Add your main skills to improve job matching.",
      icon: Tags,
    },
    {
      label: "Location added",
      isComplete: Boolean(profile?.location),
      description: "Add your location to improve relevant job suggestions.",
      icon: MapPin,
    },
  ];
};

const ResumeStatusCard = ({ hasResume, isOpeningResume, onViewResume }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
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
              <h2 className="text-base font-semibold text-slate-950">
                Resume status
              </h2>

              <span
                className={[
                  "inline-flex items-center",
                  "gap-1.5 rounded-full",
                  "px-2.5 py-1",
                  "text-xs font-medium",

                  hasResume
                    ? [
                        "bg-emerald-50",
                        "text-emerald-700",
                        "ring-1",
                        "ring-emerald-100",
                      ].join(" ")
                    : [
                        "bg-amber-50",
                        "text-amber-700",
                        "ring-1",
                        "ring-amber-100",
                      ].join(" "),
                ].join(" ")}
              >
                {hasResume ? (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                )}

                {hasResume ? "Uploaded" : "Not uploaded"}
              </span>
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {hasResume
                ? "Your current PDF resume is ready for job applications."
                : "Upload a PDF resume before submitting job applications."}
            </p>
          </div>
        </div>

        {hasResume && (
          <button
            type="button"
            className={[SECONDARY_BUTTON_CLASS_NAME, "w-full sm:w-auto"].join(
              " ",
            )}
            onClick={onViewResume}
            disabled={isOpeningResume}
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
          </button>
        )}
      </div>
    </section>
  );
};

const UploadResumeCard = ({
  hasResume,
  selectedFile,
  fileError,
  fileInputRef,
  isUploading,
  onFileChange,
  onSubmit,
}) => {
  const fieldDescriptionId = "resume-file-description";

  const fieldErrorId = "resume-file-error";

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-slate-950">
          {hasResume ? "Replace resume" : "Upload resume"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          Choose a PDF up to 5 MB.
          {hasResume
            ? " Uploading a new file replaces the current resume."
            : ""}
        </p>
      </div>

      <form onSubmit={onSubmit} className="p-4 sm:p-5">
        <label htmlFor="resume" className="text-sm font-medium text-slate-800">
          Resume PDF
        </label>

        <input
          ref={fileInputRef}
          id="resume"
          type="file"
          accept=".pdf,application/pdf"
          disabled={isUploading}
          aria-invalid={Boolean(fileError)}
          aria-describedby={[fieldDescriptionId, fileError ? fieldErrorId : ""]
            .filter(Boolean)
            .join(" ")}
          onChange={onFileChange}
          className="sr-only"
        />

        <div
          className={[
            "mt-2 flex min-w-0",
            "flex-col gap-2",
            "rounded-xl border",
            "p-2.5",

            "sm:flex-row",
            "sm:items-center",

            fileError
              ? ["border-red-300", "bg-red-50/30"].join(" ")
              : ["border-slate-200", "bg-white"].join(" "),
          ].join(" ")}
        >
          <label
            htmlFor="resume"
            className={[
              "inline-flex min-h-10",
              "w-full shrink-0",
              "cursor-pointer",
              "items-center",
              "justify-center",
              "rounded-lg",
              "bg-blue-50",
              "px-3 py-2",
              "text-sm font-medium",
              "text-blue-700",
              "transition",

              "hover:bg-blue-100",

              "focus-within:outline-none",
              "focus-within:ring-2",
              "focus-within:ring-blue-500",

              "sm:w-auto",

              isUploading ? ["cursor-not-allowed", "opacity-60"].join(" ") : "",
            ].join(" ")}
          >
            Choose file
          </label>

          <div className="min-w-0 flex-1 px-1 py-1">
            <p
              title={selectedFile?.name || undefined}
              className={[
                "truncate",
                "text-sm",

                selectedFile
                  ? ["font-medium", "text-slate-900"].join(" ")
                  : "text-slate-500",
              ].join(" ")}
            >
              {selectedFile ? selectedFile.name : "No file selected"}
            </p>

            {selectedFile && (
              <p className="mt-0.5 text-xs text-slate-500">
                {formatFileSize(selectedFile.size)} · PDF
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className={[PRIMARY_BUTTON_CLASS_NAME, "w-full sm:w-auto"].join(
              " ",
            )}
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
          </button>
        </div>
      </form>
    </section>
  );
};

const ReadinessCard = ({ readinessItems, readinessPercentage }) => {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Application readiness
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Complete the remaining items to improve your candidate profile.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {readinessPercentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Application readiness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={readinessPercentage}
        className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width]"
          style={{
            width: `${readinessPercentage}%`,
          }}
        />
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {readinessItems.map((item) => {
          const ItemIcon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div
                className={[
                  "grid h-8 w-8",
                  "shrink-0 place-items-center",
                  "rounded-full",

                  item.isComplete
                    ? ["bg-emerald-50", "text-emerald-700"].join(" ")
                    : ["bg-slate-100", "text-slate-500"].join(" "),
                ].join(" ")}
              >
                {item.isComplete ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ItemIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {item.label}
                  </p>

                  <span
                    className={[
                      "text-xs font-medium",

                      item.isComplete ? "text-emerald-700" : "text-slate-500",
                    ].join(" ")}
                  >
                    {item.isComplete ? "Complete" : "Incomplete"}
                  </span>
                </div>

                {!item.isComplete && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const MissingProfileState = () => {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700">
        <UserRoundPlus className="h-6 w-6" aria-hidden="true" />
      </div>

      <h1 className="mt-4 text-xl font-semibold text-slate-950">
        Create your candidate profile
      </h1>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Your candidate profile is required before you can upload and manage a
        resume.
      </p>

      <Link
        to="/candidate/profile"
        className={[PRIMARY_BUTTON_CLASS_NAME, "mt-5"].join(" ")}
      >
        Create profile
      </Link>
    </section>
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
    setLoadAttempt((currentAttempt) => currentAttempt + 1);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

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

  if (pageStatus === "loading") {
    return <CandidateResumePageSkeleton />;
  }

  if (pageStatus === "missing-profile") {
    return <MissingProfileState />;
  }

  if (pageStatus === "error") {
    return (
      <div className="mx-auto max-w-2xl">
        <SectionError
          title="Could not load resume details"
          message={pageErrorMessage}
          onRetry={handleRetryLoad}
        />

        <div className="mt-4 flex justify-center">
          <Link
            to="/candidate/dashboard"
            className={SECONDARY_BUTTON_CLASS_NAME}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const hasResume = Boolean(profile?.resumeUrl);

  const readinessItems = getReadinessItems(profile, hasResume);

  const completedItems = readinessItems.filter(
    (item) => item.isComplete,
  ).length;

  const readinessPercentage = Math.round(
    (completedItems / readinessItems.length) * 100,
  );

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Manage your resume
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
          Keep your submitted PDF ready for job applications and resume
          insights.
        </p>
      </header>

      <ResumeStatusCard
        hasResume={hasResume}
        isOpeningResume={isOpeningResume}
        onViewResume={handleViewResume}
      />

      {/*
       * The existing AI component remains
       * unchanged in Batch 1. It will be
       * redesigned in Pilot Batch 2.
       */}
      <CandidateResumeInsightsCard
        hasResume={hasResume}
        resumeUrl={profile?.resumeUrl}
      />

      <div
        className={[
          "grid min-w-0 gap-5",
          "lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]",
          "lg:items-start",
        ].join(" ")}
      >
        <UploadResumeCard
          hasResume={hasResume}
          selectedFile={selectedFile}
          fileError={fileError}
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
        />

        <ReadinessCard
          readinessItems={readinessItems}
          readinessPercentage={readinessPercentage}
        />
      </div>
    </div>
  );
};

export default CandidateResumePage;
