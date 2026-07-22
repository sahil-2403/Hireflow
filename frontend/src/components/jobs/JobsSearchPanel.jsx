import { useEffect, useRef, useState } from "react";

import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import Button from "../ui/Button";

import { Card, CardBody } from "../ui/Card";

import SelectInput from "../ui/SelectInput";
import TextInput from "../ui/TextInput";

const AdvancedFilterFields = ({
  idPrefix,
  draftFilters,
  sortOptions,
  employmentTypes,
  workplaceTypes,
  experienceLevels,
  onChange,
}) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SelectInput
        id={`${idPrefix}-employment-type`}
        label="Employment"
        name="employmentType"
        value={draftFilters.employmentType}
        onChange={onChange}
        options={employmentTypes}
      />

      <SelectInput
        id={`${idPrefix}-workplace-type`}
        label="Workplace"
        name="workplaceType"
        value={draftFilters.workplaceType}
        onChange={onChange}
        options={workplaceTypes}
      />

      <SelectInput
        id={`${idPrefix}-experience-level`}
        label="Experience"
        name="experienceLevel"
        value={draftFilters.experienceLevel}
        onChange={onChange}
        options={experienceLevels}
      />

      <SelectInput
        id={`${idPrefix}-sort`}
        label="Sort"
        name="sortValue"
        value={draftFilters.sortValue}
        onChange={onChange}
        options={sortOptions}
      />
    </div>
  );
};

const ActiveFilterChips = ({ chips, onRemove, onClear }) => {
  if (!chips.length) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
      <span className="mr-1 text-xs font-medium leading-5 text-slate-500">
        Active filters:
      </span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className={[
            "inline-flex min-h-9",
            "max-w-full items-center",
            "gap-1.5 rounded-full",
            "border border-blue-100",
            "bg-blue-50",
            "px-3 py-1.5",
            "text-xs font-medium",
            "text-blue-700",
            "transition-colors",

            "hover:bg-blue-100",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-blue-500",
          ].join(" ")}
        >
          <span className="min-w-0 wrap-break-word">{chip.label}</span>

          <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        className={[
          "inline-flex min-h-9",
          "items-center gap-1.5",
          "rounded-full",
          "px-3 py-1.5",
          "text-xs font-medium",
          "text-slate-600",
          "transition-colors",

          "hover:bg-slate-100",
          "hover:text-slate-900",

          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-blue-500",
        ].join(" ")}
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Clear all
      </button>
    </div>
  );
};

const JobsSearchPanel = ({
  filters,
  sortOptions,
  employmentTypes,
  workplaceTypes,
  experienceLevels,
  activeAdvancedFilterCount,
  activeFilterChips,
  canUseRecommendations,
  isRecommendedMode,
  getSortValue,
  onApplyFilters,
  onClearFilters,
  onRemoveFilter,
  onModeChange,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(filters.search);

  const [locationInput, setLocationInput] = useState(filters.location);

  const [draftFilters, setDraftFilters] = useState({
    employmentType: filters.employmentType,

    workplaceType: filters.workplaceType,

    experienceLevel: filters.experienceLevel,

    sortValue: getSortValue(filters),
  });

  const drawerRef = useRef(null);

  const filtersButtonRef = useRef(null);

  useEffect(() => {
    if (!isFiltersOpen) {
      return undefined;
    }

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;

    if (!isMobile) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;

    const focusableSelector = [
      "button:not([disabled])",
      "select:not([disabled])",
      "input:not([disabled])",
      "[href]",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const focusableElements = drawer?.querySelectorAll(focusableSelector);

    const firstElement = focusableElements?.[0];

    const lastElement = focusableElements?.[focusableElements.length - 1];

    const focusTimer = window.setTimeout(() => {
      firstElement?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsFiltersOpen(false);

        return;
      }

      if (event.key !== "Tab" || !firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();

        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);

      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);

      filtersButtonRef.current?.focus();
    };
  }, [isFiltersOpen]);

  const handleDraftFilterChange = (event) => {
    const { name, value } = event.target;

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const applySearchAndFilters = () => {
    const selectedSort =
      sortOptions.find((option) => option.value === draftFilters.sortValue) ||
      sortOptions[0];

    onApplyFilters({
      search: searchInput.trim(),

      location: locationInput.trim(),

      employmentType: draftFilters.employmentType,

      workplaceType: draftFilters.workplaceType,

      experienceLevel: draftFilters.experienceLevel,

      sortBy: selectedSort.sortBy,

      order: selectedSort.order,
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    applySearchAndFilters();
  };

  const handleApplyAdvancedFilters = () => {
    applySearchAndFilters();

    setIsFiltersOpen(false);
  };

  const handleClearFilters = () => {
    onClearFilters();

    setIsFiltersOpen(false);
  };

  const filterFields = (idPrefix) => (
    <AdvancedFilterFields
      idPrefix={idPrefix}
      draftFilters={draftFilters}
      sortOptions={sortOptions}
      employmentTypes={employmentTypes}
      workplaceTypes={workplaceTypes}
      experienceLevels={experienceLevels}
      onChange={handleDraftFilterChange}
    />
  );

  return (
    <>
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold leading-6 text-slate-950">
                Search open jobs
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Search broadly, then narrow the results using filters.
              </p>
            </div>

            {canUseRecommendations && (
              <div
                role="group"
                aria-label="Job browsing mode"
                className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1"
              >
                <button
                  type="button"
                  onClick={() => onModeChange(false)}
                  aria-pressed={!isRecommendedMode}
                  className={[
                    "min-h-10",
                    "rounded-lg px-3",
                    "text-sm font-medium",
                    "transition-colors",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-blue-500",

                    !isRecommendedMode
                      ? ["bg-white", "text-slate-950", "shadow-sm"].join(" ")
                      : ["text-slate-600", "hover:text-slate-900"].join(" "),
                  ].join(" ")}
                >
                  All jobs
                </button>

                <button
                  type="button"
                  onClick={() => onModeChange(true)}
                  aria-pressed={isRecommendedMode}
                  className={[
                    "inline-flex min-h-10",
                    "items-center",
                    "justify-center gap-1.5",
                    "rounded-lg px-3",
                    "text-sm font-medium",
                    "transition-colors",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-violet-500",

                    isRecommendedMode
                      ? ["bg-white", "text-violet-700", "shadow-sm"].join(" ")
                      : ["text-slate-600", "hover:text-violet-700"].join(" "),
                  ].join(" ")}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Suggested
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_auto_auto] lg:items-end">
              <TextInput
                id="jobs-search"
                type="search"
                label="Job title, keyword, or skill"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Frontend Developer, React, Node.js"
              />

              <TextInput
                id="jobs-location"
                type="search"
                label="Location"
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                placeholder="Pune, Mumbai, Remote"
              />

              <Button type="submit" size="lg" className="w-full lg:w-auto">
                <Search className="h-4 w-4" aria-hidden="true" />
                Search
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full lg:w-auto"
                aria-expanded={isFiltersOpen}
                onClick={() =>
                  setIsFiltersOpen((currentValue) => !currentValue)
                }
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filters
                {activeAdvancedFilterCount > 0 && (
                  <span className="grid min-w-5 place-items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                    {activeAdvancedFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </form>

          {isFiltersOpen && (
            <div className="mt-5 hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:block">
              {filterFields("desktop-jobs")}

              <div className="mt-5 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClearFilters}
                >
                  Clear all
                </Button>

                <Button type="button" onClick={handleApplyAdvancedFilters}>
                  Apply filters
                </Button>
              </div>
            </div>
          )}

          <ActiveFilterChips
            chips={activeFilterChips}
            onRemove={onRemoveFilter}
            onClear={handleClearFilters}
          />
        </CardBody>
      </Card>

      {isFiltersOpen && (
        <div className="fixed inset-0 z-80 lg:hidden" aria-hidden={false}>
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
            onClick={() => setIsFiltersOpen(false)}
          />

          <section
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-jobs-filters-title"
            className={[
              "absolute inset-y-0",
              "right-0 flex",
              "w-full max-w-md",
              "flex-col bg-white",
              "shadow-2xl",
            ].join(" ")}
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div>
                <h2
                  id="mobile-jobs-filters-title"
                  className="text-base font-semibold leading-6 text-slate-950"
                >
                  Filter jobs
                </h2>

                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Refine employment, workplace, experience, and sorting.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className={[
                  "grid h-11 w-11",
                  "shrink-0",
                  "place-items-center",
                  "rounded-xl",
                  "text-slate-500",
                  "transition-colors",

                  "hover:bg-slate-100",
                  "hover:text-slate-900",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-blue-500",
                ].join(" ")}
                aria-label="Close filters"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              {filterFields("mobile-jobs")}
            </div>

            <footer
              className={[
                "grid grid-cols-2",
                "gap-3 border-t",
                "border-slate-200",
                "bg-white px-4 py-4",
                "pb-[max(1rem,env(safe-area-inset-bottom))]",
              ].join(" ")}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearFilters}
              >
                Clear all
              </Button>

              <Button type="button" onClick={handleApplyAdvancedFilters}>
                Apply filters
              </Button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
};

export default JobsSearchPanel;
