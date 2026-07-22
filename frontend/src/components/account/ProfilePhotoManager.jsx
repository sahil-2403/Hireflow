import { useId, useRef, useState } from "react";

import { Camera, LoaderCircle, Trash2, Upload } from "lucide-react";

import { deleteProfilePhoto, uploadProfilePhoto } from "../../api/auth.api";

import getApiError from "../../utils/getApiError";

import Button from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import Alert from "../ui/Alert";

import ProfileAvatar from "../common/ProfileAvatar";

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

const ProfilePhotoManager = ({
  user,
  updateUser,
  name,
  eyebrow = "Profile photo",
  title = "Your photo",
  description = "Upload a clear photo so people can recognize your profile.",
  compact = false,
  embedded = false,
}) => {
  const inputId = useId();

  const fileInputRef = useRef(null);

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const clearSelectedPhoto = () => {
    setSelectedPhoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;

    setPhotoSuccess("");
    setPhotoError("");

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
      setPhotoSuccess(result.message);
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
      setPhotoSuccess(result.message);
    } catch (error) {
      const normalizedError = getApiError(error);

      setPhotoError(normalizedError.message);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  if (compact) {
    const compactContent = (
      <>
        {embedded ? (
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <Camera className="h-4 w-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium leading-5 text-blue-600">
                {eyebrow}
              </p>

              <h2 className="text-base font-semibold leading-6 text-slate-950">
                {title}
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-start gap-3">
            <ProfileAvatar user={user} name={name} size="lg" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Camera
                  className="h-4 w-4 shrink-0 text-blue-600"
                  aria-hidden="true"
                />

                <p className="text-xs font-medium leading-5 text-blue-600">
                  {eyebrow}
                </p>
              </div>

              <h2 className="mt-0.5 text-base font-semibold leading-6 text-slate-950">
                {title}
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Choose photo
          </label>

          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className={[
              "block w-full",
              "rounded-xl border",
              "border-slate-200",
              "bg-white px-3 py-2",
              "text-sm text-slate-700",

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
        </div>

        {photoError && (
          <Alert variant="error" className="mt-4">
            {photoError}
          </Alert>
        )}

        {photoSuccess && (
          <Alert variant="success" className="mt-4">
            {photoSuccess}
          </Alert>
        )}

        <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2 xl:grid-cols-1">
          <Button
            type="button"
            size="sm"
            disabled={isUploadingPhoto || !selectedPhoto}
            onClick={handleUploadPhoto}
            fullWidth
          >
            {isUploadingPhoto ? (
              <>
                <LoaderCircle
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
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
            disabled={isDeletingPhoto || !user?.profilePhotoUrl}
            onClick={handleDeletePhoto}
            fullWidth
          >
            {isDeletingPhoto ? (
              <>
                <LoaderCircle
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
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
      </>
    );

    if (embedded) {
      return (
        <section className="mt-5 border-t border-slate-100 pt-5">
          {compactContent}
        </section>
      );
    }

    return (
      <Card>
        <CardBody className="p-4">{compactContent}</CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-black text-slate-950">{title}</h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </CardHeader>

      <CardBody>
        <div className="flex items-center gap-4">
          <ProfileAvatar user={user} name={name} size="xl" />

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              {user?.profilePhotoUrl ? "Photo uploaded" : "No photo uploaded"}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              JPG, PNG, or WebP. Maximum size 2 MB.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-bold text-slate-700"
          >
            Choose photo
          </label>

          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-blue-700 hover:file:bg-blue-100"
          />

          {selectedPhoto && (
            <p className="mt-2 text-sm text-slate-600">
              Selected file:{" "}
              <span className="font-bold text-slate-900">
                {selectedPhoto.name}
              </span>
            </p>
          )}
        </div>

        {photoError && (
          <Alert variant="error" className="mt-4">
            {photoError}
          </Alert>
        )}

        {photoSuccess && (
          <Alert variant="success" className="mt-4">
            {photoSuccess}
          </Alert>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            disabled={isUploadingPhoto || !selectedPhoto}
            onClick={handleUploadPhoto}
            fullWidth
          >
            {isUploadingPhoto
              ? "Uploading..."
              : user?.profilePhotoUrl
                ? "Change photo"
                : "Upload photo"}
          </Button>

          <Button
            type="button"
            variant="danger"
            disabled={isDeletingPhoto || !user?.profilePhotoUrl}
            onClick={handleDeletePhoto}
            fullWidth
          >
            {isDeletingPhoto ? "Removing..." : "Remove photo"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProfilePhotoManager;
