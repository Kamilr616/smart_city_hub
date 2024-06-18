import React, { createContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";
import { jwtDecode } from "jwt-decode";

// Create the UserContext
const UserContext = createContext();

// Helper functions for encryption and decryption
const encryptData = (data) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    import.meta.env.VITE_ENCRYPTION_KEY
  ).toString();
};

function decryptData(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(
    ciphertext,
    import.meta.env.VITE_ENCRYPTION_KEY
  );
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Create a provider component
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const decryptedUser = decryptData(userCookie);
        const data = jwtDecode(decryptedUser.token);
        setUser({ ...decryptedUser, role: data.role, userId: data.userId });
      } catch (error) {
        console.error("Failed to decrypt user data:", error);
      }
    }
  }, []);

  const setUserAndCookie = (user) => {
    // setUser(user);
    const data = jwtDecode(user.token);
    setUser({ ...user, role: data.role, userId: data.userId });
    const encryptedUser = encryptData(user);
    Cookies.set("user", encryptedUser, { expires: 7 }); // Cookie expires in 7 days
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("user");
  };

  const getRole = () => {
    if (Cookies.get("user")) {
      const data = jwtDecode(decryptData(Cookies.get("user")).token);

      return data.isAdmin;
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser: setUserAndCookie, logout, getRole }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
