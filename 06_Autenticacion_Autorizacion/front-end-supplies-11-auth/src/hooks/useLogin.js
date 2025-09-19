import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { buildApiUrl } from "../utils/apiConfig";
import CryptoJS from "crypto-js";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, setUser, setSessionId, clearSession, startSessionTimer } = useContext(AuthContext);
  const navigate = useNavigate();

  const login = async (username, password) => {
    setIsLoading(true);
    setError("");

    // Validación básica
    if (!username.trim() || !password.trim()) {
      setError("CIF de empresa y contraseña son obligatorios");
      setIsLoading(false);
      return { success: false };
    }

    try {
      // Generar hash MD5 de la contraseña
      const hashedPassword = CryptoJS.MD5(password).toString();

      // Preparar el body de la petición
      const loginData = {
        username: username,
        password: hashedPassword
      };

      // Realizar petición al backend
      const apiUrl = buildApiUrl('USERS', '/api/v1/sessions');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      if (response.ok) {
        const sessionData = await response.json();

        // Obtener información del usuario usando el sessionId
        const userInfoUrl = buildApiUrl('USERS', `/api/v1/users/${username}`);
        console.log("Lanzando peticion con sessionId:", sessionData.sessionId);
        const userResponse = await fetch(userInfoUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.sessionId}`
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();

          // Login exitoso - almacenar sessionId y datos completos del usuario
          setSessionId(sessionData.sessionId);
          setUser({
            ...userData,
            sessionId: sessionData.sessionId
          });

          console.log("Login exitoso para:", userData.name);
          setIsLoading(false);
          return { success: true };
        } else {
          throw new Error(`Error al obtener información del usuario: ${userResponse.status}`);
        }
      } else if (response.status === 401) {
        setError("Credenciales incorrectas");
        setIsLoading(false);
        return { success: false };
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error en el servidor. Inténtalo de nuevo.");
      setIsLoading(false);
      return { success: false };
    }
  };

  const renewSession = async (sessionId) => {
    try {
      if (!user || !user.cif) {
        throw new Error('No hay información de usuario disponible');
      }
      // Hacer petición GET al perfil como heartbeat para renovar sesión
      const userInfoUrl = buildApiUrl('USERS', `/api/v1/users/${user.cif}`);
      const response = await fetch(userInfoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`
        }
      });

      if (response.ok) {
        // No necesitamos hacer nada con la respuesta, solo reiniciar el temporizador
        startSessionTimer();
        return { success: true };
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error("Error renovando sesión:", err);
      // Si falla la renovación, cerrar sesión
      clearSession();
      navigate("/");
      return { success: false };
    }
  };

  const logout = () => {
    clearSession();
    navigate("/");
  };

  return {
    login,
    logout,
    renewSession,
    isLoading,
    error,
    clearError: () => setError("")
  };
}
