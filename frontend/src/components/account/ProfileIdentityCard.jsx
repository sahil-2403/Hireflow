import { UserRound } from "lucide-react";

import ProfilePhotoManager from "./ProfilePhotoManager";

import ProfileAvatar from "../common/ProfileAvatar";

import { Card, CardBody } from "../ui/Card";

const ProfileIdentityCard = ({
  user,
  updateUser,
  name,
  subtitle,
  description,
  completion = null,
}) => {
  return (
    <Card className="flex h-full flex-col">
      <CardBody className="flex flex-1 flex-col">
        <div className="flex items-center gap-2">
          <UserRound
            className="h-4 w-4 shrink-0 text-blue-600"
            aria-hidden="true"
          />

          <p className="text-xs font-medium text-blue-600">Profile</p>
        </div>

        <div className="mt-3 flex min-w-0 items-start gap-4">
          <ProfileAvatar
            user={user}
            name={name}
            size="xl"
            fallbackClassName="bg-blue-50 text-blue-700"
          />

          <div className="min-w-0">
            <h2 className="wrap-break-word text-lg font-semibold leading-7 text-slate-950">
              {name}
            </h2>

            <p className="mt-1 wrap-break-word text-sm font-medium leading-5 text-slate-700">
              {subtitle}
            </p>

            {description && (
              <p className="mt-1 wrap-break-word text-sm leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        {completion && (
          <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium leading-5 text-slate-500">
                Profile completion
              </p>

              <p className="text-xs font-semibold leading-5 text-slate-700">
                {completion.percentage}%
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                style={{
                  width: `${completion.percentage}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {completion.completed} of {completion.total} core details
              completed.
            </p>
          </section>
        )}

        <section className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold leading-5 text-slate-950">
            Profile photo
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Upload a clear photo so people can recognise your profile.
          </p>

          <div className="mt-4">
            <ProfilePhotoManager user={user} updateUser={updateUser} />
          </div>
        </section>
      </CardBody>
    </Card>
  );
};

export default ProfileIdentityCard;
