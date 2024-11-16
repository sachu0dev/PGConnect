import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface MiscSlice {
  isNavMenuOpen: boolean;
}

const initialState: MiscSlice = {
  isNavMenuOpen: false,
};

export const miscSlice = createSlice({
  name: "misc",
  initialState,
  reducers: {
    openNavMenu: (state) => {
      state.isNavMenuOpen = true;
    },
    closeNavMenu: (state) => {
      state.isNavMenuOpen = false;
    },
  },
});

export const { openNavMenu, closeNavMenu } = miscSlice.actions;

export default miscSlice.reducer;
