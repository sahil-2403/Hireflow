import { useEffect, useRef, useState } from "react";

import { Link2Off, LoaderCircle } from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { verifyEmail } from "../../api/auth.api";

import AuthPageShell from "../../components/auth/AuthPageShell";
import AuthResultState from "../../components/auth/AuthResultState";
import AuthSupportVisualPanel from "../../components/auth/AuthSupportVisualPanel";

import Button from "../../components/ui/Button";

import getApiError from "../../utils/getApiError";

const VerifyEmailPage = () => {
  const { token } = useParams();

  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");

  const [message, setMessage] = useState(
    "Please wait while we verify your email address.",
  );

  /*
   * Reuse the same verification request in
   * React StrictMode so the token is not
   * submitted to the API twice.
   */
  const requestStateRef = useRef({
    token: null,
    promise: null,
    handled: false,
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");

      setMessage(
        "The verification token is missing. Request a new verification email to continue.",
      );

      return;
    }

    if (requestStateRef.current.token !== token) {
      requestStateRef.current = {
        token,

        promise: verifyEmail(token),

        handled: false,
      };
    }

    const request = requestStateRef.current.promise;

    request
      .then((result) => {
        if (requestStateRef.current.handled) {
          return;
        }

        requestStateRef.current.handled = true;

        navigate("/login", {
          replace: true,

          state: {
            message:
              result.message ||
              "Email verified successfully. You can now sign in.",
          },
        });
      })
      .catch((error) => {
        if (requestStateRef.current.handled) {
          return;
        }

        requestStateRef.current.handled = true;

        const normalizedError = getApiError(error);

        setStatus("error");

        setMessage(normalizedError.message);
      });
  }, [token, navigate]);

  return (
    <AuthPageShell
      variant="verification"
      scene={<AuthSupportVisualPanel variant="verification" />}
      formClassName="max-w-md"
    >
      {status === "verifying" ? (
        <AuthResultState
          icon={LoaderCircle}
          tone="info"
          isLoading
          title="Verifying your email"
          description={message}
        />
      ) : (
        <AuthResultState
          icon={Link2Off}
          tone="error"
          title="Could not verify email"
          description={message}
          actions={
            <>
              <Button as={Link} to="/resend-verification" fullWidth>
                Request a new link
              </Button>

              <Button as={Link} to="/login" variant="secondary" fullWidth>
                Return to sign in
              </Button>
            </>
          }
        />
      )}
    </AuthPageShell>
  );
};

export default VerifyEmailPage;
