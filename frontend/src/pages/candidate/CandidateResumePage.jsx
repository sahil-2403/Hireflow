import { useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import {
  getMyCandidateProfile,
  uploadCandidateResume,
  viewCandidateResume,
} from "../../api/candidate.api";

import getApiError from "../../utils/getApiError";
import openPdfBlob from "../../utils/openPdfBlob";

import Button from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import PageHero from "../../components/ui/PageHero";

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

const getReadinessItems = (profile, hasResume) => {
  return [
    {
      label: "Candidate profile",
      isComplete: Boolean(profile),
      description: "Your profile is required before resume upload.",
    },
    {
      label: "Resume PDF",
      isComplete: hasResume,
      description: "Upload a PDF resume to apply to jobs.",
    },
    {
      label: "Skills added",
      isComplete: Array.isArray(profile?.skills) && profile.skills.length > 0,
      description: "Skills help recruiters understand your fit.",
    },
    {
      label: "Location added",
      isComplete: Boolean(profile?.location),
      description: "Location helps match you with relevant jobs.",
    },
  ];
};

const getFileInputClassName = () => {
  return [
    "block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition",
    "file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-blue-700",
    "hover:file:bg-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
  ].join(" ");
};

const StatusPill = ({ hasResume }) => {
  return (
    <span
      className={[
        "inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold",
        hasResume
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      ].join(" ")}
    >
      {hasResume ? "Uploaded" : "Not uploaded"}
    </span>
  );
};

const AlertMessage = ({ type = "error", children }) => {
  const className =
    type === "success"
      ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

  return (
    <div className={className} role={type === "success" ? "status" : "alert"}>
      {children}
    </div>
  );
};

const ResumeStatusPanel = ({ hasResume, onViewResume, isOpeningResume }) => {
  return (
    <div
      className={[
        "rounded-2xl border p-5",
        hasResume
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-amber-200 bg-amber-50/70",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div
            className={[
              "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl",
              hasResume ? "bg-emerald-100" : "bg-amber-100",
            ].join(" ")}
          >
            📄
          </div>

          <div>
            <StatusPill hasResume={hasResume} />

            <h3 className="mt-3 text-lg font-black text-slate-950">
              {hasResume
                ? "Resume uploaded successfully"
                : "No resume uploaded yet"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasResume
                ? "Your resume is ready and can be used while applying to jobs."
                : "Upload your resume before applying to jobs from your candidate account."}
            </p>
          </div>
        </div>

        {hasResume && (
          <Button
            type="button"
            variant="secondary"
            onClick={onViewResume}
            disabled={isOpeningResume}
          >
            {isOpeningResume ? "Opening..." : "View resume"}
          </Button>
        )}
      </div>
    </div>
  );
};

const UploadResumeForm = ({
  hasResume,
  selectedFile,
  fileInputRef,
  onFileChange,
  onSubmit,
  isUploading,
}) => {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-slate-50 p-5">
      <h3 className="text-lg font-black text-slate-950">
        {hasResume ? "Replace resume" : "Upload resume"}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Select a PDF file from your device. Your old resume will be replaced
        after successful upload.
      </p>

      <div className="mt-5">
        <FormField
          label="Resume PDF"
          htmlFor="resume"
          hint="PDF only. Maximum size: 5 MB."
        >
          <input
            ref={fileInputRef}
            id="resume"
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            className={getFileInputClassName()}
          />
        </FormField>
      </div>

      {selectedFile && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Selected file
          </p>

          <p className="mt-2 font-bold text-slate-950">{selectedFile.name}</p>

          <p className="mt-1 text-sm text-slate-600">
            {formatFileSize(selectedFile.size)} · PDF
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button as={Link} to="/candidate/dashboard" variant="secondary">
          Back to dashboard
        </Button>

        <Button type="submit" disabled={isUploading || !selectedFile}>
          {isUploading
            ? "Uploading..."
            : hasResume
              ? "Replace resume"
              : "Upload resume"}
        </Button>
      </div>
    </form>
  );
};

const ReadinessCard = ({ readinessItems, readinessPercentage }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              Readiness
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Application readiness
            </h2>
          </div>

          <div
            className="grid h-20 w-20 place-items-center rounded-full text-sm font-black text-blue-700"
            style={{
              background: `conic-gradient(#2563eb ${
                readinessPercentage * 3.6
              }deg, #e2e8f0 0deg)`,
            }}
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
              {readinessPercentage}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="grid gap-3">
          {readinessItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={[
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black",
                    item.isComplete
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {item.isComplete ? "✓" : "!"}
                </span>

                <div>
                  <p className="text-sm font-black text-slate-950">
                    {item.label}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

const ResumeTipsCard = () => {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Resume tips
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">
          Keep it recruiter-friendly
        </h2>
      </CardHeader>

      <CardBody>
        <div className="grid gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">Use a clear file</p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Upload a clean PDF resume with readable formatting.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">
              Add project impact
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Mention what you built, the stack used, and the result.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-900">
              Match job keywords
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Keep important skills visible and easy to scan.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const CandidateResumePage = () => {
  const fileInputRef = useRef(null);

  const [pageStatus, setPageStatus] = useState("loading");

  const [profile, setProfile] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [apiError, setApiError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  const [isOpeningResume, setIsOpeningResume] = useState(false);

  useEffect(() => {
    let shouldIgnore = false;

    const loadProfile = async () => {
      try {
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

        setApiError(normalizedError.message);
        setPageStatus("error");
      }
    };

    loadProfile();

    return () => {
      shouldIgnore = true;
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setApiError("");
    setSuccessMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setSelectedFile(null);
      setApiError("Only PDF resume files are allowed.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setSelectedFile(null);
      setApiError("Resume file must be 5 MB or smaller.");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setApiError("");
    setSuccessMessage("");

    if (!selectedFile) {
      setApiError("Please select a PDF resume before uploading.");
      return;
    }

    try {
      setIsUploading(true);

      const result = await uploadCandidateResume(selectedFile);

      setProfile(result.data);
      setSelectedFile(null);
      setSuccessMessage(result.message);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewResume = async () => {
    try {
      setApiError("");
      setIsOpeningResume(true);

      const resumeBlob = await viewCandidateResume();

      openPdfBlob(resumeBlob);
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    } finally {
      setIsOpeningResume(false);
    }
  };

  if (pageStatus === "loading") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">Loading resume details...</p>
        </CardBody>
      </Card>
    );
  }

  if (pageStatus === "missing-profile") {
    return (
      <EmptyState
        icon="👤"
        title="Create your candidate profile first"
        description="You need to create your candidate profile before uploading a resume."
        action={
          <Button as={Link} to="/candidate/profile">
            Create profile
          </Button>
        }
      />
    );
  }

  if (pageStatus === "error") {
    return (
      <EmptyState
        icon="⚠️"
        title="Could not load resume page"
        description={apiError}
        action={
          <Button as={Link} to="/candidate/dashboard">
            Back to dashboard
          </Button>
        }
      />
    );
  }

  const hasResume = Boolean(profile?.resumeUrl);

  const readinessItems = getReadinessItems(profile, hasResume);

  const completedReadinessItems = readinessItems.filter(
    (item) => item.isComplete,
  ).length;

  const readinessPercentage = Math.round(
    (completedReadinessItems / readinessItems.length) * 100,
  );

  return (
    <div className="grid gap-6">
      <PageHero
        eyebrow="Candidate resume"
        title="Manage your resume"
        description="Upload a PDF resume and keep it ready for job applications."
        meta={<StatusPill hasResume={hasResume} />}
      />

      {apiError && <AlertMessage>{apiError}</AlertMessage>}

      {successMessage && (
        <AlertMessage type="success">{successMessage}</AlertMessage>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Resume file
            </p>

            <h2 className="mt-2 text-xl font-black text-slate-950">
              Current resume status
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              HireFlow currently accepts PDF resumes up to 5 MB.
            </p>
          </CardHeader>

          <CardBody className="grid gap-5">
            <ResumeStatusPanel
              hasResume={hasResume}
              onViewResume={handleViewResume}
              isOpeningResume={isOpeningResume}
            />

            <UploadResumeForm
              hasResume={hasResume}
              selectedFile={selectedFile}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
              isUploading={isUploading}
            />
          </CardBody>
        </Card>

        <aside className="grid gap-6">
          <ReadinessCard
            readinessItems={readinessItems}
            readinessPercentage={readinessPercentage}
          />

          <ResumeTipsCard />
        </aside>
      </div>
    </div>
  );
};

export default CandidateResumePage;
