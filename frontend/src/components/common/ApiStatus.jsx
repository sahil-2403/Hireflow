import { useEffect, useState } from "react";

import { getApiHealth } from "../../api/health.api";
import getApiError from "../../utils/getApiError";

const ApiStatus = () => {
  const [status, setStatus] = useState("checking");

  const [message, setMessage] = useState("Checking API connection...");

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const result = await getApiHealth();

        setStatus("connected");
        setMessage(result.message);
      } catch (error) {
        const apiError = getApiError(error);

        setStatus("disconnected");
        setMessage(apiError.message);
      }
    };

    checkApiHealth();
  }, []);

  const statusClasses = {
    checking: "border-amber-200 bg-amber-50 text-amber-700",

    connected: "border-emerald-200 bg-emerald-50 text-emerald-700",

    disconnected: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusClasses[status]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />

      <span>{message}</span>
    </div>
  );
};

export default ApiStatus;
