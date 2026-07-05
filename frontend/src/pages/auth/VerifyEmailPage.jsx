import { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { verifyEmail } from "../../api/auth.api";

import getApiError from "../../utils/getApiError";

import Button from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";

const getStatusBoxClassName = (status) => {
  const statusClasses = {
    verifying: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return [
    "mt-6 rounded-xl border px-4 py-4 text-sm",
    statusClasses[status] || statusClasses.verifying,
  ].join(" ");
};

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
  }, [token, navigate]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-slate-50 to-white px-4 py-10 sm:px-6">
      <section className="mx-auto flex max-w-6xl items-center justify-center">
        <Card className="w-full max-w-md">
          <CardBody className="p-6 text-center sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-3xl">
              {status === "error" ? "⚠️" : "✉️"}
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Email verification
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Verifying your email
            </h1>

            <div
              className={getStatusBoxClassName(status)}
              role={status === "error" ? "alert" : "status"}
            >
              {message}
            </div>

            <div className="mt-6 grid gap-3">
              {status === "success" && (
                <Button as={Link} to="/login" fullWidth>
                  Continue to login
                </Button>
              )}

              {status === "error" && (
                <>
                  <Button as={Link} to="/resend-verification" fullWidth>
                    Request a new verification link
                  </Button>

                  <Button as={Link} to="/login" variant="secondary" fullWidth>
                    Return to login
                  </Button>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </section>
    </main>
  );
};

export default VerifyEmailPage;
