import { createContext, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Create the UserContext
const UserContext = createContext();

const loadStoredUser = () => {
  const storedUser = sessionStorage.getItem("user");
  if (!storedUser) return null;
  try {
    const user = JSON.parse(storedUser);
    const claims = jwtDecode(user.token);
    return { ...user, role: claims.role, userId: claims.userId, isAdmin: claims.isAdmin };
  } catch {
    sessionStorage.removeItem("user");
    return null;
  }
};

// Create a provider component
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(loadStoredUser);

  const storeUser = (user) => {
    const data = jwtDecode(user.token);
    const authenticatedUser = { ...user, role: data.role, userId: data.userId, isAdmin: data.isAdmin };
    setUser(authenticatedUser);
    sessionStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    try {
      if (user?.token) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/user/logout`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }
    } finally {
      setUser(null);
      sessionStorage.removeItem("user");
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser: storeUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { UserContext, UserProvider };
