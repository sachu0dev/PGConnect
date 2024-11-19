import api from "@/lib/axios";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/lib/features/user/userSlice";

export const loginUser =
  (email: string, password: string) => async (dispatch: any) => {
    dispatch(loginStart());
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const accessToken = response.data.accessToken;
      dispatch(loginSuccess(accessToken));
    } catch (error) {
      dispatch(loginFailure("Invalid credentials"));
    }
  };
