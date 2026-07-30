import { useEffect, useMemo, useState } from "react";

import {
  AtSign,
  Building2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  getMyCompanyMemberProfile,
  updateMyCompanyMemberProfile,
} from "../../api/companyMember.api";

import ProfileIdentityCard from "../../components/account/ProfileIdentityCard";

import CompanyLogo from "../../components/common/CompanyLogo";

import CompanySetupRequired from "../../components/company/CompanySetupRequired";

import CompanyMyProfilePageSkeleton from "../../components/loading/CompanyMyProfilePageSkeleton";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "../../components/ui/Card";

import PageHero from "../../components/ui/PageHero";
import SectionError from "../../components/ui/SectionError";
import TextInput from "../../components/ui/TextInput";

import { companyMemberProfileSchema } from "../../features/companies/companyMember.schemas";

import useAuth from "../../hooks/useAuth";

import getApiError from "../../utils/getApiError";
import getRoleDisplayName from "../../utils/getRoleDisplayName";
import isCompanyOwnerProfileMissingError from "../../utils/isCompanyOwnerProfileMissingError";
import isCompanyProfileMissingError from "../../utils/isCompanyProfileMissingError";
import notify from "../../utils/notify";

const getDefaultValues = (profile = null) => {
  return {
    firstName: profile?.member?.firstName ?? "",
    lastName: profile?.member?.lastName ?? "",
    phone: profile?.member?.phone ?? "",
    jobTitle: profile?.member?.jobTitle ?? "",
  };
};

const convertFormDataToPayload = (formData) => {
  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone || null,
    jobTitle: formData.jobTitle,
  };
};

const getFullName = (values, user) => {
  const name = [values.firstName, values.lastName].filter(Boolean).join(" ");

  return name || user?.username || user?.email || "Your profile";
};

const AccountInformationItem = ({ icon: Icon, label, value, company }) => {
  return (
    <div className="flex min-w-0 items-center gap-3 bg-white p-4">
      {company ? (
        <CompanyLogo
          company={company}
          size="sm"
          fallbackClassName="bg-blue-600 text-white"
        />
      ) : (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium leading-5 text-slate-500">{label}</p>

        <p className="mt-0.5 wrap-break-word text-sm font-semibold leading-6 text-slate-900">
          {value || "Unavailable"}
        </p>
      </div>
    </div>
  );
};

const AccountInfoCard = ({ user, profile }) => {
  const companyName = profile?.company?.name || "Company profile required";

  const items = [
    {
      key: "workspace",
      label: "Company workspace",
      value: companyName,
      company: profile?.company || null,
    },
    {
      key: "username",
      label: "Username",
      value: user?.username || "Unavailable",
      icon: AtSign,
    },
    {
      key: "email",
      label: "Email",
      value: user?.email || "Unavailable",
      icon: Mail,
    },
    {
      key: "role",
      label: "Your role",
      value: getRoleDisplayName(user?.role),
      icon: ShieldCheck,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2
            className="h-4 w-4 shrink-0 text-blue-600"
            aria-hidden="true"
          />

          <p className="text-xs font-medium text-blue-600">
            Account information
          </p>
        </div>

        <h2 className="mt-1 text-lg font-semibold leading-7 text-slate-950">
          Your account and workspace details
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          These details come from your login account and company workspace.
        </p>
      </CardHeader>

      <CardBody>
        <div className="items-stretch grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <AccountInformationItem
              key={item.key}
              icon={item.icon || Building2}
              label={item.label}
              value={item.value}
              company={item.company}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

const CompanyMyProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [pageStatus, setPageStatus] = useState("loading");
  const [mode, setMode] = useState("edit");
  const [profile, setProfile] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companyMemberProfileSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedValues = useWatch({ control }) ?? getDefaultValues();

  const fullName = useMemo(() => {
    return getFullName(watchedValues, user);
  }, [watchedValues, user]);

  useEffect(() => {
    let shouldIgnore = false;

    const loadProfile = async () => {
      try {
        const result = await getMyCompanyMemberProfile();

        if (shouldIgnore) {
          return;
        }

        setProfile(result.data);
        setMode("edit");
        setApiError("");
        reset(getDefaultValues(result.data));
        setPageStatus("ready");
      } catch (error) {
        if (shouldIgnore) {
          return;
        }

        const normalizedError = getApiError(error);

        if (isCompanyProfileMissingError(normalizedError)) {
          setProfile(null);
          setApiError(normalizedError.message);
          setPageStatus("company-missing");
          return;
        }

        if (isCompanyOwnerProfileMissingError(normalizedError)) {
          setProfile(null);
          setMode("create");
          setApiError("");
          reset(getDefaultValues());
          setPageStatus("ready");
          return;
        }

        setApiError(normalizedError.message);
        setPageStatus("error");
      }
    };

    loadProfile();

    return () => {
      shouldIgnore = true;
    };
  }, [loadAttempt, reset]);

  const handleRetryLoad = () => {
    setApiError("");
    setPageStatus("loading");
    setLoadAttempt((currentAttempt) => currentAttempt + 1);
  };

  const onSubmit = async (formData) => {
    setApiError("");

    const payload = convertFormDataToPayload(formData);

    try {
      const result = await updateMyCompanyMemberProfile(payload);

      setProfile(result.data);
      setMode("edit");
      reset(getDefaultValues(result.data));

      notify.success(result.message || "Profile updated successfully.");
    } catch (error) {
      const normalizedError = getApiError(error);

      setApiError(normalizedError.message);
    }
  };

  const isLoading = pageStatus === "loading";
  const isCompanyMissing = pageStatus === "company-missing";
  const hasLoadError = pageStatus === "error";
  const isReady = pageStatus === "ready";

  const pageTitle =
    mode === "create"
      ? "Complete your personal profile"
      : "Manage your profile";

  return (
    <div className="grid gap-5">
      <PageHero
        title={pageTitle}
        description="Keep your personal company workspace details and profile photo up to date."
      />

      {isCompanyMissing && (
        <CompanySetupRequired description="Create your company profile before completing your personal company profile." />
      )}

      {isLoading && <CompanyMyProfilePageSkeleton />}

      {hasLoadError && (
        <SectionError
          title="Could not load your profile"
          message={apiError}
          onRetry={handleRetryLoad}
        />
      )}

      {isReady && (
        <>
          <div className="grid min-w-0 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
            <ProfileIdentityCard
              user={user}
              updateUser={updateUser}
              name={fullName}
              subtitle={watchedValues.jobTitle || "Add your job title"}
              description={
                profile?.company?.name
                  ? `${profile.company.name} workspace`
                  : "Company workspace"
              }
            />

            <form onSubmit={handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <p className="text-xs font-medium text-blue-600">
                    Personal details
                  </p>

                  <h2 className="mt-1 text-lg font-semibold leading-7 text-slate-950">
                    Your company workspace profile
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    These details help identify you inside your company hiring
                    workspace.
                  </p>
                </CardHeader>

                <CardBody>
                  {apiError && (
                    <Alert variant="error" className="mb-5">
                      {apiError}
                    </Alert>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput
                      id="firstName"
                      type="text"
                      label="First name"
                      placeholder="Sahil"
                      error={errors.firstName?.message}
                      {...register("firstName")}
                    />

                    <TextInput
                      id="lastName"
                      type="text"
                      label="Last name"
                      placeholder="Pawar"
                      error={errors.lastName?.message}
                      {...register("lastName")}
                    />

                    <TextInput
                      id="jobTitle"
                      type="text"
                      label="Job title"
                      placeholder="Founder, HR Manager, Technical Recruiter"
                      error={errors.jobTitle?.message}
                      {...register("jobTitle")}
                    />

                    <TextInput
                      id="phone"
                      type="text"
                      label="Phone"
                      placeholder="+91 98765 43210"
                      hint="Optional. Maximum 20 characters."
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                  </div>
                </CardBody>

                <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    as={Link}
                    to="/company/dashboard"
                    type="button"
                    variant="secondary"
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <LoaderCircle
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}

                    {isSubmitting
                      ? mode === "create"
                        ? "Creating..."
                        : "Saving..."
                      : mode === "create"
                        ? "Create profile"
                        : "Save changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>

          <AccountInfoCard user={user} profile={profile} />
        </>
      )}
    </div>
  );
};

export default CompanyMyProfilePage;
