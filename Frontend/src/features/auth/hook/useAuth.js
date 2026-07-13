import { useDispatch, useSelector } from "react-redux";
import { setUser, removeUser, setError } from "../../auth.slice";
import { register, login, getMyProfile, logout } from "../service/auth.api";


export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  const handleRegister = async (data) => {
    try {
      const response = await register(data);
      // We don't automatically set user here since they need to verify email
      return { success: true, message: response.message };
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      dispatch(setError(msg));
      return { success: false, error: msg };
    }
  };

  const handleLogin = async (data) => {
    try {
      const response = await login(data);
      const user = response.user;
      dispatch(setUser(user));
      localStorage.setItem("user", JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      const status = error.response?.status;
      dispatch(setError(msg));
      return { success: false, error: msg, status };
    }
  };

  const handleGetMyProfile = async () => {
    try {
      const response = await getMyProfile();
      const user = response.user;
      dispatch(setUser(user));
      localStorage.setItem("user", JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      dispatch(setError(msg));
      dispatch(removeUser());
      localStorage.removeItem("user");
      return { success: false, error: msg };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(removeUser());
      localStorage.removeItem("user");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      dispatch(setError(msg));
      return { success: false, error: msg };
    }
  };
  return {
    user,
    loading,
    error,
    handleRegister,
    handleLogin,
    handleGetMyProfile,
    handleLogout,
  };
};
