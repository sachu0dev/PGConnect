import useAuth from "@/hooks/userAuth";
import { GoogleLogin } from "@react-oauth/google";
import { CredentialResponse } from "@react-oauth/google";

interface GoogleButtonProps {
  userType?: "user" | "pgOwner";
}

export default function GoogleButton({ userType = "user" }: GoogleButtonProps) {
  const { googleLogin, isLoading, error } = useAuth();

  const onSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      googleLogin(credentialResponse.credential, userType);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => {
          console.error("Login Failed");
        }}
        useOneTap
        context={userType === "pgOwner" ? "sign up" : "signin"}
        text={isLoading ? "logging_in" : "signin_with"}
        shape="rectangular"
        locale="en"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
