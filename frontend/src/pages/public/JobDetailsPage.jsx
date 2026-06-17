import { useParams } from "react-router-dom";

const JobDetailsPage = () => {
  const { jobId } = useParams();

  return (
    <main>
      <h1>Job Details</h1>

      <p>Selected job ID: {jobId}</p>
    </main>
  );
};

export default JobDetailsPage;
