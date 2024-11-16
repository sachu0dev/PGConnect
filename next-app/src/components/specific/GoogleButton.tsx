import { GoogleLogin } from "react-google-login";
import useAuth from "@/hooks/useAuth";

export default function GoogleButton() {
  const { googleLogin } = useAuth();

  const onSuccess = (response: any) => {
    googleLogin(response.tokenId);
  };

  const onFailure = (error: any) => {
    console.error("Google login failed", error);
  };

  return (
    <GoogleLogin
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
      buttonText="Login with Google"
      onSuccess={onSuccess}
      onFailure={onFailure}
      cookiePolicy="single_host_origin"
    />
  );
}
