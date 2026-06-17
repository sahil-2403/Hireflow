import { useParams } from "react-router-dom";

const ResetPasswordPage = () => {
  const { token } = useParams();

  return (
    <main>
      <h1>Reset Password</h1>

      <p>Reset token received: {token ? "Yes" : "No"}</p>
    </main>
  );
};

export default ResetPasswordPage;
