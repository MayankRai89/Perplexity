import { createSlice } from "@reduxjs/toolkit";

const getInitialUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: initialUser,
    loading: initialUser ? false : false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    removeUser: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setUser, removeUser, setLoading, setError } = authSlice.actions;

export default authSlice.reducer;
