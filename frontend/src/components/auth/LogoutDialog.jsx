import { useEffect, useRef, useState } from "react";

import { LoaderCircle, LogOut, ShieldAlert, X } from "lucide-react";

import getApiError from "../../utils/getApiError";
import cn from "../../utils/cn";

import Alert from "../ui/Alert";
import Button from "../ui/Button";

const LogoutDialog = ({ isOpen, onClose, onConfirm, returnFocusRef }) => {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  const [logoutFromAllDevices, setLogoutFromAllDevices] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !isOpen) {
      return undefined;
    }

    /*
     * Capture the current element now so the cleanup
     * restores focus to the same element that opened
     * this dialog.
     */
    const returnFocusElement = returnFocusRef?.current;

    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    if (!dialog.open) {
      dialog.showModal();
    }

    const focusFrame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);

      document.body.style.overflow = previousBodyOverflow;

      if (dialog.open) {
        dialog.close();
      }

      if (returnFocusElement?.isConnected) {
        window.requestAnimationFrame(() => {
          returnFocusElement.focus();
        });
      }
    };
  }, [isOpen, returnFocusRef]);

  const resetDialogState = () => {
    setLogoutFromAllDevices(false);
    setErrorMessage("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetDialogState();
    onClose();
  };

  const handleDialogCancel = (event) => {
    /*
     * Prevent the browser from closing the native
     * dialog independently of React state.
     */
    event.preventDefault();

    handleClose();
  };

  const handleBackdropMouseDown = (event) => {
    /*
     * A click directly on <dialog>, rather than its
     * content, represents a backdrop click.
     */
    if (event.target !== event.currentTarget) {
      return;
    }

    handleClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onConfirm({
        logoutFromAllDevices,
      });
    } catch (error) {
      const normalizedError = getApiError(error);

      setErrorMessage(normalizedError.message);
      setIsSubmitting(false);
    }
  };

  const confirmationLabel = logoutFromAllDevices
    ? "Log out all devices"
    : "Log out";

  const submittingLabel = logoutFromAllDevices
    ? "Logging out all devices..."
    : "Logging out...";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      onCancel={handleDialogCancel}
      onMouseDown={handleBackdropMouseDown}
      className={[
        "m-auto",
        "max-h-[calc(100dvh-2rem)]",
        "w-[calc(100%-2rem)]",
        "max-w-md",
        "overflow-y-auto",
        "rounded-2xl",
        "border border-slate-200",
        "bg-white p-0",
        "text-left text-slate-900",
        "shadow-2xl",
        "shadow-slate-950/20",
        "backdrop:bg-slate-950/40",
        "backdrop:backdrop-blur-[1px]",
      ].join(" ")}
    >
      <form onSubmit={handleSubmit}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2
                id="logout-dialog-title"
                className="text-lg font-semibold leading-7 text-slate-950"
              >
                Log out of HireFlow?
              </h2>

              <p
                id="logout-dialog-description"
                className="mt-1 text-sm leading-6 text-slate-600"
              >
                You will be logged out from this browser. Your other devices
                will remain active.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close logout confirmation"
            className={[
              "grid h-10 w-10",
              "shrink-0 place-items-center",
              "rounded-xl",
              "text-slate-500",
              "transition-colors",

              "hover:bg-slate-100",
              "hover:text-slate-700",

              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-blue-500",

              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-4 px-5 py-5 sm:px-6">
          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

          <label
            className={cn(
              [
                "flex cursor-pointer",
                "items-start gap-3",
                "rounded-xl border",
                "p-4",
                "transition-colors",
              ].join(" "),

              logoutFromAllDevices
                ? ["border-red-200", "bg-red-50/60"].join(" ")
                : [
                    "border-slate-200",
                    "bg-slate-50/60",
                    "hover:border-slate-300",
                  ].join(" "),

              isSubmitting && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="checkbox"
              checked={logoutFromAllDevices}
              disabled={isSubmitting}
              onChange={(event) => {
                setLogoutFromAllDevices(event.target.checked);

                setErrorMessage("");
              }}
              className={[
                "mt-0.5 h-5 w-5",
                "shrink-0",
                "rounded",
                "border-slate-300",
                "accent-blue-600",

                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-blue-500",
                "focus-visible:ring-offset-2",

                "disabled:cursor-not-allowed",
              ].join(" ")}
            />

            <span className="min-w-0">
              <span className="block text-sm font-medium leading-6 text-slate-900">
                Log out from all devices
              </span>

              <span className="mt-0.5 block text-sm leading-6 text-slate-600">
                Also end every other active HireFlow session associated with
                your account.
              </span>
            </span>
          </label>

          {logoutFromAllDevices && (
            <div
              role="note"
              className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-6 text-red-950">
                    Every active session will end
                  </p>

                  <p className="mt-0.5 text-sm leading-6 text-red-800">
                    You will need to sign in again on every browser and device
                    using your HireFlow account.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button type="submit" variant="danger" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}

            {isSubmitting ? submittingLabel : confirmationLabel}
          </Button>
        </footer>
      </form>
    </dialog>
  );
};

export default LogoutDialog;
