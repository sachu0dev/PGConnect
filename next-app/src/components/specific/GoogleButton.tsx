import useAuth from "@/hooks/userAuth";
import { GoogleLogin } from "@react-oauth/google";
import { CredentialResponse } from "@react-oauth/google";

export default function GoogleButton() {
  const { googleLogin, isLoading, error } = useAuth();

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
          console.error("Login Failed");
        }}
        useOneTap
        text={isLoading ? "Logging in..." : "Sign in with Google"}
        shape="rectangular"
        locale="en"
        className={`w-full py-2 px-4 font-semibold rounded-lg transition-all 
          duration-200 transform shadow-lg 
          bg-white dark:bg-[#0D0D0D] text-black dark:text-white 
          hover:shadow-xl active:translate-y-1`}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
