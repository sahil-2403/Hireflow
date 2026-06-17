import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <main>
      <h1>404</h1>

      <p>The requested page could not be found.</p>

      <Link to="/">Return to homepage</Link>
    </main>
  );
};

export default NotFoundPage;
