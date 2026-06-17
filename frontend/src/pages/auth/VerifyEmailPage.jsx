import { useParams } from "react-router-dom";

const VerifyEmailPage = () => {
  const { token } = useParams();

  return (
    <main>
      <h1>Email Verification</h1>

      <p>Verification token received: {token ? "Yes" : "No"}</p>
    </main>
  );
};

export default VerifyEmailPage;
