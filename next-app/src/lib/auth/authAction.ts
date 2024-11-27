import api from "@/lib/axios";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/lib/features/user/userSlice";
import { toast } from "sonner";
import { AppDispatch } from "../store";

export const loginUser =
  (email: string, password: string) => async (dispatch: AppDispatch) => {
    dispatch(loginStart());
    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      if (!response.data.success) {
        toast(response.data.message);
        return false;
      } else {
        const accessToken = response.data.accessToken;
        dispatch(loginSuccess(accessToken));
        toast("Login successful!");
        return true;
      }
    } catch (error) {
      console.log(error);

      dispatch(loginFailure("Invalid credentials"));
      return false;
    }
  };

export const registerUser =
  (username: string, email: string, password: string, phoneNumber: string) =>
  async (dispatch: AppDispatch) => {
    dispatch(loginStart());
    try {
      const response = await api.post("/api/auth/signup", {
        username,
        email,
        password,
        phoneNumber,
      });

      console.log(response.data);

      if (!response.data.success) {
        toast(response.data.message);
        return false;
      } else {
        toast("Verification email sent successfully");
        return true;
      }
    } catch (error) {
      console.log(error);

      dispatch(loginFailure("Invalid credentials"));
      return false;
    }
  };
