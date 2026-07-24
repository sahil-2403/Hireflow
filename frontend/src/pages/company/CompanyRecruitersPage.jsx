import { useEffect, useRef, useState } from "react";

import { Info, LoaderCircle, UsersRound } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createRecruiter,
  listRecruiters,
  updateRecruiterStatus,
} from "../../api/company.api";

import PasswordField from "../../components/common/PasswordField";
import ProfileAvatar from "../../components/common/ProfileAvatar";

import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import CompanyRecruitersPageSkeleton from "../../components/loading/CompanyRecruitersPageSkeleton";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "../../components/ui/Card";

import EmptyState from "../../components/ui/EmptyState";
import PageHero from "../../components/ui/PageHero";
import Pill from "../../components/ui/Pill";
import SectionError from "../../components/ui/SectionError";
import TextInput from "../../components/ui/TextInput";

import { createRecruiterSchema } from "../../features/companies/recruiter.schemas";

import getApiError from "../../utils/getApiError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";
import notify from "../../utils/notify";

const defaultValues = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
};

const getRecruiterId = (recruiter) => {
  return (
    recruiter._id ||
    recruiter.id ||
    recruiter.userId?._id ||
    recruiter.userId?.id
  );
};

const getRecruiterUsername = (recruiter) => {
  return recruiter.username || recruiter.userId?.username || "unknown";
};

const getRecruiterEmail = (recruiter) => {
  return recruiter.email || recruiter.userId?.email || "Email unavailable";
};

const getRecruiterName = (recruiter) => {
  const name = [recruiter.firstName, recruiter.lastName]
    .filter(Boolean)
    .join(" ");

  return name || getRecruiterUsername(recruiter);
};

const RecruiterStatusPill = ({ recruiter }) => {
  return (
    <Pill variant={recruiter.isActive ? "emerald" : "slate"}>
      {recruiter.isActive ? "Active" : "Inactive"}
    </Pill>
  );
};

const RecruiterStats = ({ activeCount, inactiveCount, totalCount }) => {
  const stats = [
    {
      label: "Active",
      value: activeCount,
      valueClassName: "text-emerald-700",
    },
    {
      label: "Inactive",
      value: inactiveCount,
      valueClassName: "text-slate-700",
    },
    {
      label: "Total",
      value: totalCount,
      valueClassName: "text-blue-700",
    },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
      {stats.map((stat) => (
        <div key={stat.label} className="px-2 py-2.5 text-center sm:px-3">
          <p className="text-[11px] font-medium leading-4 text-slate-500">
            {stat.label}
          </p>

          <p
            className={[
              "mt-0.5",
              "text-lg",
              "font-semibold",
              "leading-6",
              stat.valueClassName,
            ].join(" ")}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

const RecruiterRow = ({ recruiter, updatingRecruiterId, onToggleStatus }) => {
  const recruiterId = getRecruiterId(recruiter);

  const isUpdating = updatingRecruiterId === recruiterId;

  return (
    <article className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <ProfileAvatar
          user={recruiter.userId}
          name={getRecruiterName(recruiter)}
          size="md"
          fallbackClassName="bg-blue-50 text-blue-700"
        />

        <div className="min-w-0">
          <h3 className="wrap-break-word text-sm font-semibold leading-6 text-slate-950">
            {getRecruiterName(recruiter)}
          </h3>

          <p className="wrap-break-word text-sm font-medium leading-5 text-slate-700">
            {recruiter.jobTitle || "Recruiter"}
          </p>

          <p className="mt-1 wrap-break-word text-xs leading-5 text-slate-500">
            @{getRecruiterUsername(recruiter)}
          </p>

          <p className="wrap-break-word text-xs leading-5 text-slate-500">
            {getRecruiterEmail(recruiter)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:contents">
        <RecruiterStatusPill recruiter={recruiter} />

        <Button
          type="button"
          variant={recruiter.isActive ? "danger" : "secondary"}
          size="sm"
          disabled={isUpdating}
          onClick={() => onToggleStatus(recruiter)}
          className={[
            "w-full",
            "sm:w-auto",
            "sm:min-w-28",

            recruiter.isActive
              ? ""
              : ["border-blue-200", "text-blue-700", "hover:bg-blue-50"].join(
                  " ",
                ),
          ].join(" ")}
        >
          {isUpdating && (
            <LoaderCircle
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}

          {isUpdating
            ? "Updating"
            : recruiter.isActive
              ? "Deactivate"
              : "Activate"}
        </Button>
      </div>
    </article>
  );
};

const RecruiterAccountsCard = ({
  recruiters,
  activeCount,
  inactiveCount,
  updatingRecruiterId,
  isRefreshing,
  onToggleStatus,
}) => {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-7 text-slate-950">
              Recruiter accounts
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Active recruiters can log in and work on company jobs and
              applications.
            </p>
          </div>

          {isRefreshing && (
            <p
              role="status"
              className="inline-flex shrink-0 items-center gap-2 text-xs leading-5 text-slate-500"
            >
              <LoaderCircle
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Refreshing
            </p>
          )}
        </div>
      </CardHeader>

      <CardBody className="flex flex-1 flex-col">
        <RecruiterStats
          activeCount={activeCount}
          inactiveCount={inactiveCount}
          totalCount={recruiters.length}
        />

        {recruiters.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            size="compact"
            title="No recruiters created yet"
            description="Create your first recruiter account to let your team manage jobs and applications."
            className="mt-5 border-0 bg-transparent"
          />
        ) : (
          <div
            className={[
              "mt-10",
              "divide-y",
              "divide-slate-100",
              "transition-opacity",

              isRefreshing ? "opacity-60" : "",
            ].join(" ")}
          >
            {recruiters.map((recruiter) => {
              const recruiterId = getRecruiterId(recruiter);

              return (
                <RecruiterRow
                  key={recruiterId || getRecruiterUsername(recruiter)}
                  recruiter={recruiter}
                  updatingRecruiterId={updatingRecruiterId}
                  onToggleStatus={onToggleStatus}
                />
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

const CreateRecruiterCard = ({
  register,
  errors,
  formError,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="h-full">
      <Card className="flex h-full flex-col">
        <CardHeader>
          <h2 className="text-lg font-semibold leading-7 text-slate-950">
            Create recruiter
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Recruiters can manage jobs and applications. Only company admins can
            manage the company profile and recruiter access.
          </p>
        </CardHeader>

        <CardBody className="flex-1">
          {formError && (
            <Alert variant="error" className="mb-5">
              {formError}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              id="firstName"
              type="text"
              label="First name"
              placeholder="First name"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register("firstName")}
            />

            <TextInput
              id="lastName"
              type="text"
              label="Last name"
              placeholder="Last name"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register("lastName")}
            />

            <TextInput
              id="jobTitle"
              type="text"
              label="Job title"
              placeholder="Technical Recruiter"
              autoComplete="organization-title"
              error={errors.jobTitle?.message}
              className="sm:col-span-2"
              {...register("jobTitle")}
            />

            <TextInput
              id="username"
              type="text"
              label="Username"
              placeholder="recruiter_one"
              autoComplete="username"
              hint="Only letters, numbers, and underscores are allowed."
              error={errors.username?.message}
              {...register("username")}
            />

            <TextInput
              id="email"
              type="email"
              label="Email"
              placeholder="recruiter@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <PasswordField
              id="password"
              label="Temporary password"
              placeholder="Recruiter123"
              autoComplete="new-password"
              registration={register("password")}
              error={errors.password?.message}
              className="sm:col-span-2"
            />

            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-xs leading-5 text-slate-600 sm:col-span-2">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-700"
                aria-hidden="true"
              />

              <p>
                Password must contain at least 8 characters, one uppercase
                letter, one lowercase letter, and one number.
              </p>
            </div>
          </div>
        </CardBody>

        <CardFooter>
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting && (
              <LoaderCircle
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}

            {isSubmitting ? "Creating..." : "Create recruiter"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

const CompanyRecruitersPage = () => {
  const [requestStatus, setRequestStatus] = useState("loading");

  const [recruiters, setRecruiters] = useState([]);

  const [loadError, setLoadError] = useState("");

  const [formError, setFormError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [updatingRecruiterId, setUpdatingRecruiterId] = useState(null);

  const hasLoadedDataRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRecruiterSchema),

    defaultValues,
  });

  useEffect(() => {
    let shouldIgnore = false;

    const fetchRecruiters = async () => {
      const isRefresh = hasLoadedDataRef.current;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setRequestStatus("loading");
      }

      setLoadError("");

      try {
        const result = await listRecruiters();

        if (shouldIgnore) {
          return;
        }

        setRecruiters(result.data ?? []);

        hasLoadedDataRef.current = true;

        setRequestStatus("success");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (isCompanyProfileMissingError(normalizedError)) {
          setRecruiters([]);

          hasLoadedDataRef.current = false;

          setLoadError(normalizedError.message);

          setRequestStatus("company-missing");

          return;
        }

        if (isRefresh) {
          setRequestStatus("success");

          notify.error("Could not refresh recruiters", {
            description: normalizedError.message,
          });

          return;
        }

        setLoadError(normalizedError.message);

        setRequestStatus("error");
      } finally {
        if (!shouldIgnore) {
          setIsRefreshing(false);
        }
      }
    };

    fetchRecruiters();

    return () => {
      shouldIgnore = true;
    };
  }, [refreshKey]);

  const handleRetryLoad = () => {
    setLoadError("");

    setRequestStatus("loading");

    setRefreshKey((currentValue) => currentValue + 1);
  };

  const onSubmit = async (formData) => {
    setFormError("");

    try {
      const result = await createRecruiter(formData);

      reset(defaultValues);

      notify.success(result.message || "Recruiter created successfully.");

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      setFormError(normalizedError.message);
    }
  };

  const handleToggleRecruiterStatus = async (recruiter) => {
    const recruiterId = getRecruiterId(recruiter);

    const nextStatus = !recruiter.isActive;

    try {
      setUpdatingRecruiterId(recruiterId);

      const result = await updateRecruiterStatus(recruiterId, nextStatus);

      setRecruiters((currentRecruiters) =>
        currentRecruiters.map((currentRecruiter) => {
          if (getRecruiterId(currentRecruiter) !== recruiterId) {
            return currentRecruiter;
          }

          return {
            ...currentRecruiter,
            isActive: nextStatus,
          };
        }),
      );

      notify.success(
        result.message ||
          `Recruiter ${nextStatus ? "activated" : "deactivated"} successfully.`,
      );

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (error) {
      const normalizedError = getApiError(error);

      notify.error("Could not update recruiter access", {
        description: normalizedError.message,
      });
    } finally {
      setUpdatingRecruiterId(null);
    }
  };

  const activeCount = recruiters.reduce((total, recruiter) => {
    return total + (recruiter.isActive ? 1 : 0);
  }, 0);

  const inactiveCount = recruiters.length - activeCount;

  const isLoading = requestStatus === "loading";

  const isCompanyMissing = requestStatus === "company-missing";

  const hasLoadError = requestStatus === "error";

  const isReady = requestStatus === "success";

  return (
    <div className="grid gap-5">
      <PageHero
        title="Manage recruiters"
        description="Create recruiter accounts and activate or deactivate access to your company hiring workspace."
      />

      {isCompanyMissing && (
        <CompanySetupRequired description="Create your company profile before inviting recruiters." />
      )}

      {isLoading && <CompanyRecruitersPageSkeleton />}

      {hasLoadError && (
        <SectionError
          title="Could not load recruiters"
          message={loadError}
          onRetry={handleRetryLoad}
        />
      )}

      {isReady && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] xl:items-stretch">
          <RecruiterAccountsCard
            recruiters={recruiters}
            activeCount={activeCount}
            inactiveCount={inactiveCount}
            updatingRecruiterId={updatingRecruiterId}
            isRefreshing={isRefreshing}
            onToggleStatus={handleToggleRecruiterStatus}
          />

          <CreateRecruiterCard
            register={register}
            errors={errors}
            formError={formError}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit(onSubmit)}
          />
        </div>
      )}
    </div>
  );
};

export default CompanyRecruitersPage;
