import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  username: string;
  email: string;
  phoneNumber: string;
  id: string;
}
interface UserState {
  isUser: boolean;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  userData: User | null;
}

const initialState: UserState = {
  isUser: false,
  accessToken: null,
  loading: true,
  error: null,
  userData: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    setUser(state, action: PayloadAction<User>) {
      state.userData = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    loginSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      state.isUser = true;
      state.accessToken = action.payload;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
    },
    logout(state) {
      state.isUser = false;
      state.accessToken = null;
      state.loading = false;
      state.error = null;
    },
    refreshUser(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.loading = false;
      state.isUser = true;
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  setAccessToken,
  setLoading,
  logout,
  refreshUser,
  setUser,
} = userSlice.actions;

export default userSlice.reducer;
