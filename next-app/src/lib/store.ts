import { configureStore } from "@reduxjs/toolkit";
import miscReducer from "./features/misc/miscSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      misc: miscReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
