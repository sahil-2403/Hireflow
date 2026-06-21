import { useEffect, useState } from "react";

import { getCurrentUser } from "../../api/auth.api";

import getApiError from "../../utils/getApiError";

const CurrentUserCard = () => {
  const [status, setStatus] = useState("loading");

  const [currentUser, setCurrentUser] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const result = await getCurrentUser();

        setCurrentUser(result.data);
        setStatus("success");
      } catch (error) {
        const normalizedError = getApiError(error);

        setErrorMessage(normalizedError.message);

        setStatus("error");
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
        Protected API check
      </p>

      <h2 className="text-xl font-bold text-slate-950">Current session</h2>

      {status === "loading" && (
        <p className="mt-4 text-sm text-slate-600">
          Checking authenticated session...
        </p>
      )}

      {status === "error" && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {status === "success" && currentUser && (
        <div className="mt-4 grid gap-3 text-sm">
          <div>
            <p className="font-medium text-slate-500">Username</p>

            <p className="font-semibold text-slate-900">
              {currentUser.username || "Not available"}
            </p>
          </div>

          <div>
            <p className="font-medium text-slate-500">Email</p>

            <p className="font-semibold text-slate-900">{currentUser.email}</p>
          </div>

          <div>
            <p className="font-medium text-slate-500">Role</p>

            <p className="font-semibold capitalize text-slate-900">
              {currentUser.role}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default CurrentUserCard;
