import useAuth from "@/hooks/userAuth";
import { GoogleLogin } from "@react-oauth/google";
import { CredentialResponse } from "@react-oauth/google";

export default function GoogleButton() {
  const { googleLogin, error } = useAuth();

  const onSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      googleLogin({ tokenId: credentialResponse.credential });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => {
          console.log("Login Failed");
        }}
        useOneTap
        shape="rectangular"
        locale="en"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
