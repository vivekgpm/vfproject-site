import { useAuth } from "../contexts/AuthContext";

export const useIsAdmin = () => {
  const { user } = useAuth();
  if (user === null) {
    return false;
  } else {
    if (user.role === "admin") {
      return true;
    } else if (user.role === "user") {
      return false;
    }
  }
};
