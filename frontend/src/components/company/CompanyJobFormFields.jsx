import { Banknote, BriefcaseBusiness, ListChecks } from "lucide-react";

import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  WORKPLACE_TYPES,
} from "../../features/jobs/job.constants";

import { Card, CardBody, CardHeader } from "../ui/Card";

import SelectInput from "../ui/SelectInput";
import TextareaInput from "../ui/TextareaInput";
import TextInput from "../ui/TextInput";

const JobSectionHeader = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-7 text-slate-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

const CompanyJobFormFields = ({ register, errors }) => {
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <JobSectionHeader
            icon={BriefcaseBusiness}
            title="Role information"
            description="Add the core information candidates will see when discovering this job."
          />
        </CardHeader>

        <CardBody>
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="grid gap-4">
              <TextInput
                id="title"
                type="text"
                label="Job title"
                placeholder="MERN Stack Developer"
                hint="Use a clear and searchable role title."
                error={errors.title?.message}
                {...register("title")}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <SelectInput
                  id="employmentType"
                  label="Employment type"
                  placeholder="Select type"
                  options={EMPLOYMENT_TYPES}
                  error={errors.employmentType?.message}
                  {...register("employmentType")}
                />

                <SelectInput
                  id="workplaceType"
                  label="Workplace type"
                  placeholder="Select type"
                  options={WORKPLACE_TYPES}
                  error={errors.workplaceType?.message}
                  {...register("workplaceType")}
                />

                <SelectInput
                  id="experienceLevel"
                  label="Experience level"
                  placeholder="Select level"
                  options={EXPERIENCE_LEVELS}
                  error={errors.experienceLevel?.message}
                  {...register("experienceLevel")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  id="location"
                  type="text"
                  label="Location"
                  placeholder="Pune, India"
                  hint="Examples: Pune, India · Mumbai, India · Remote"
                  error={errors.location?.message}
                  {...register("location")}
                />

                <TextInput
                  id="skillsText"
                  type="text"
                  label="Required skills"
                  placeholder="React, Node.js, MongoDB"
                  hint="Separate skills with commas."
                  error={errors.skillsText?.message}
                  {...register("skillsText")}
                />
              </div>
            </div>

            <TextareaInput
              id="description"
              label="Job description"
              rows={10}
              placeholder="Describe the role, team, work, expectations, and why a candidate should apply."
              hint="Minimum 20 characters. Maximum 10,000 characters."
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <JobSectionHeader
            icon={ListChecks}
            title="Role content"
            description="Explain what the candidate will do and what experience or qualifications the role requires."
          />
        </CardHeader>

        <CardBody>
          <div className="grid gap-5 lg:grid-cols-2">
            <TextareaInput
              id="responsibilitiesText"
              label="Responsibilities"
              rows={8}
              placeholder={`Build frontend features
Integrate backend APIs
Write clean reusable code`}
              hint="Write one responsibility per line."
              error={errors.responsibilitiesText?.message}
              {...register("responsibilitiesText")}
            />

            <TextareaInput
              id="requirementsText"
              label="Requirements"
              rows={8}
              placeholder={`Good JavaScript knowledge
React project experience
Basic REST API understanding`}
              hint="Write one requirement per line."
              error={errors.requirementsText?.message}
              {...register("requirementsText")}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <JobSectionHeader
            icon={Banknote}
            title="Salary information"
            description="Salary information is optional. You can also decide whether candidates should see it."
          />
        </CardHeader>

        <CardBody>
          <div className="flex flex-col gap-5 ">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
              <TextInput
                id="salaryMin"
                type="number"
                min="0"
                inputMode="numeric"
                label="Minimum salary"
                placeholder="300000"
                error={errors.salaryMin?.message}
                {...register("salaryMin")}
              />

              <TextInput
                id="salaryMax"
                type="number"
                min="0"
                inputMode="numeric"
                label="Maximum salary"
                placeholder="700000"
                error={errors.salaryMax?.message}
                {...register("salaryMax")}
              />

              <TextInput
                id="salaryCurrency"
                type="text"
                label="Currency"
                maxLength={3}
                placeholder="INR"
                inputClassName="uppercase"
                error={errors.salaryCurrency?.message}
                {...register("salaryCurrency")}
              />
            </div>

            <label
              htmlFor="isSalaryVisible"
              className={[
                "flex min-h-11",
                "cursor-pointer",
                "items-start gap-3",
                "rounded-xl border",
                "border-slate-200",
                "bg-slate-50/60",
                "p-4",
                "transition-colors",
                "hover:border-blue-200",
                "hover:bg-blue-50/40",
              ].join(" ")}
            >
              <input
                id="isSalaryVisible"
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                {...register("isSalaryVisible")}
              />

              <span>
                <span className="block text-sm font-semibold leading-5 text-slate-900">
                  Show salary on the public job page
                </span>

                <span className="mt-1 block text-[0.8rem]  text-slate-600">
                  Turn this off when the company does not want to disclose the
                  salary range publicly.
                </span>
              </span>
            </label>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CompanyJobFormFields;
