import { useId, useRef, useState } from "react";

import { LoaderCircle, Trash2, Upload } from "lucide-react";

import { deleteProfilePhoto, uploadProfilePhoto } from "../../api/auth.api";

import getApiError from "../../utils/getApiError";

import Alert from "../ui/Alert";
import Button from "../ui/Button";

const PROFILE_PHOTO_MAX_SIZE = 2 * 1024 * 1024;

const ALLOWED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const validateProfilePhotoFile = (file) => {
  if (!file) {
    return "Please select a profile photo first.";
  }

  if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or WebP images are allowed.";
  }

  if (file.size > PROFILE_PHOTO_MAX_SIZE) {
    return "Profile photo must be 2 MB or smaller.";
  }

  return "";
};

const ProfilePhotoManager = ({ user, updateUser }) => {
  const inputId = useId();
  const fileInputRef = useRef(null);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [photoError, setPhotoError] = useState("");

  const [photoSuccess, setPhotoSuccess] = useState("");

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const isBusy = isUploadingPhoto || isDeletingPhoto;

  const clearSelectedPhoto = () => {
    setSelectedPhoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    setPhotoError("");
    setPhotoSuccess("");

    if (!file) {
      clearSelectedPhoto();
      return;
    }

    const validationError = validateProfilePhotoFile(file);

    if (validationError) {
      clearSelectedPhoto();

      setPhotoError(validationError);

      return;
    }

    setSelectedPhoto(file);
  };

  const handleUploadPhoto = async () => {
    const validationError = validateProfilePhotoFile(selectedPhoto);

    if (validationError) {
      setPhotoError(validationError);

      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoError("");
      setPhotoSuccess("");

      const result = await uploadProfilePhoto(selectedPhoto);

      updateUser(result.data.user);

      clearSelectedPhoto();

      setPhotoSuccess(result.message || "Profile photo updated successfully.");
    } catch (error) {
      const normalizedError = getApiError(error);

      setPhotoError(normalizedError.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    const confirmed = window.confirm(
      "Remove your profile photo? Your initials will be shown instead.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingPhoto(true);
      setPhotoError("");
      setPhotoSuccess("");

      const result = await deleteProfilePhoto();

      updateUser(result.data.user);

      clearSelectedPhoto();

      setPhotoSuccess(result.message || "Profile photo removed successfully.");
    } catch (error) {
      const normalizedError = getApiError(error);

      setPhotoError(normalizedError.message);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-medium leading-6 text-slate-700"
      >
        Choose photo
      </label>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={isBusy}
        onChange={handlePhotoChange}
        className={[
          "block w-full min-w-0",
          "rounded-xl border",
          "border-slate-200",
          "bg-white px-3 py-2",
          "text-sm text-slate-700",
          "disabled:cursor-not-allowed",
          "disabled:opacity-60",
          "file:mr-3",
          "file:rounded-lg",
          "file:border-0",
          "file:bg-blue-50",
          "file:px-3 file:py-2",
          "file:text-sm",
          "file:font-medium",
          "file:text-blue-700",
          "hover:file:bg-blue-100",
        ].join(" ")}
      />

      <p className="mt-2 text-xs leading-5 text-slate-500">
        JPG, PNG or WebP. Maximum 2 MB.
      </p>

      {selectedPhoto && (
        <p className="mt-2 wrap-break-word text-xs leading-5 text-slate-600">
          Selected:{" "}
          <span className="font-medium text-slate-900">
            {selectedPhoto.name}
          </span>
        </p>
      )}

      {photoError && (
        <Alert variant="error" className="mt-3">
          {photoError}
        </Alert>
      )}

      {photoSuccess && (
        <Alert variant="success" className="mt-3">
          {photoSuccess}
        </Alert>
      )}

      <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2">
        <Button
          type="button"
          size="sm"
          disabled={isBusy || !selectedPhoto}
          onClick={handleUploadPhoto}
          fullWidth
        >
          {isUploadingPhoto ? (
            <>
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden="true" />

              {user?.profilePhotoUrl ? "Change photo" : "Upload photo"}
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={isBusy || !user?.profilePhotoUrl}
          onClick={handleDeletePhoto}
          fullWidth
        >
          {isDeletingPhoto ? (
            <>
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Removing...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove photo
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePhotoManager;
