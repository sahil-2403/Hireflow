import { Readable } from "node:stream";

import cloudinary from "../../config/cloudinary.js";
import ApiError from "../errors/ApiError.js";

const uploadBuffer = (fileBuffer, { folder, resourceType }) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(502, "Unable to upload file to cloud storage"),
          );
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      },
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

const deleteAsset = async (publicId, resourceType) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error) {
    console.error(`Cloudinary deletion failed for ${publicId}:`, error.message);
  }
};

const uploadResumeFile = (fileBuffer) => {
  return uploadBuffer(fileBuffer, {
    folder: "hireflow/resumes",
    resourceType: "raw",
  });
};

const uploadLogoFile = (fileBuffer) => {
  return uploadBuffer(fileBuffer, {
    folder: "hireflow/company-logos",
    resourceType: "image",
  });
};

export { uploadResumeFile, uploadLogoFile, deleteAsset };
