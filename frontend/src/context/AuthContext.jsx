import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tuwing mag-lo-load ang app (o mag-rerefresh ang page), tingnan natin
  // kung may naka-save nang login info sa sessionStorage.
  // Nabubura ito kapag isinara ang tab, kaya login ulit ang kailangan.
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user");
      const storedToken = sessionStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      // Sira ang naka-save na data, burahin
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
    setLoading(false);
  }, []);

  // Tinatawag ito pagkatapos ng successful na verify-otp
  const login = (userData, token) => {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook para madaling magamit ang AuthContext sa ibang components
export const useAuth = () => useContext(AuthContext);
