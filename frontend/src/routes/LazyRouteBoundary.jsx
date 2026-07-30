import { Suspense } from "react";

import { Outlet } from "react-router-dom";

import RouteLoadingFallback from "../components/loading/RouteLoadingFallback";

const LazyRouteBoundary = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Outlet />
    </Suspense>
  );
};

export default LazyRouteBoundary;
