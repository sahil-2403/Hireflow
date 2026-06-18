import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { verifyEmail } from "../../api/auth.api";

import getApiError from "../../utils/getApiError";

const VerifyEmailPage = () => {
  const { token } = useParams();

  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");

  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    const verifyUserEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const result = await verifyEmail(token);

        navigate("/login", {
          replace: true,
          state: {
            message:
              result.message ||
              "Email verified successfully. You can now log in.",
          },
        });
      } catch (error) {
        const normalizedError = getApiError(error);

        setStatus("error");
        setMessage(normalizedError.message);
      }
    };

    verifyUserEmail();
  }, [token,navigate]);

  const statusClasses = {
    verifying: "border-amber-200 bg-amber-50 text-amber-700",

    success: "border-emerald-200 bg-emerald-50 text-emerald-700",

    error: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Email verification
        </h1>

        <div
          className={`mt-6 rounded-lg border px-4 py-4 text-sm ${statusClasses[status]}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {status === "success" && (
            <Link
              to="/login"
              className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Continue to login
            </Link>
          )}

          {status === "error" && (
            <Link
              to="/resend-verification"
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Request a new verification link
            </Link>
          )}
        </div>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
