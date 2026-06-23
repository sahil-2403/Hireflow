import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  getMyCandidateProfile,
  uploadCandidateResume,
  viewCandidateResume,
} from "../../api/candidate.api";

import getApiError from "../../utils/getApiError";
import openPdfBlob from "../../utils/openPdfBlob";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const CandidateResumePage = () => {
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading resume details...</p>
      </section>
    );
  }

  if (pageStatus === "missing-profile") {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-700">
          Profile required
        </p>

        <h1 className="text-2xl font-bold text-slate-950">
          Create your candidate profile first
        </h1>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          You need to create your candidate profile before uploading a resume.
        </p>

        <Link
          to="/candidate/profile"
          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Create profile
        </Link>
      </section>
    );
  }

  if (pageStatus === "error") {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="font-semibold text-red-700">Could not load resume page</p>

        <p className="mt-2 text-sm text-red-700">{apiError}</p>
      </section>
    );
  }

  const hasResume = Boolean(profile?.resumeUrl);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Candidate resume
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Upload your resume
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Upload a PDF resume so you can apply to jobs on HireFlow.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Current resume status
        </h2>

        <div
          className={[
            "mt-4 rounded-lg border px-4 py-3 text-sm font-medium",
            hasResume
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {hasResume ? "Resume uploaded" : "No resume uploaded yet"}
        </div>

        {hasResume && (
          <button
            type="button"
            onClick={handleViewResume}
            disabled={isOpeningResume}
            className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isOpeningResume ? "Opening resume..." : "View current resume"}
          </button>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-slate-950">Upload new resume</h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Only PDF files are allowed. Maximum file size is 5 MB.
        </p>

        {apiError && (
          <div
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {apiError}
          </div>
        )}

        {successMessage && (
          <div
            className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <div className="mt-5">
          <label
            htmlFor="resume"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Resume PDF
          </label>

          <input
            id="resume"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />

          {selectedFile && (
            <p className="mt-2 text-sm text-slate-600">
              Selected file:{" "}
              <span className="font-medium text-slate-900">
                {selectedFile.name}
              </span>
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/candidate/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to dashboard
          </Link>

          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUploading ? "Uploading..." : "Upload resume"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CandidateResumePage;
