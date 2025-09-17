import React, { createContext, useEffect, useState } from "react";
import {
  getToken,
  getRefreshToken,
  getRole,
  getUser,
  getSchoolCode,
  getSchoolPhoto,
  setRole,
  setUser,
  setSchoolCode,
  setSchoolPhoto,
  setToken,
  setRefreshToken,
} from "../lib/storage";
import { setSessionClearCallback } from "../lib/api";

export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [session, setSessionState] = useState({
    isAuthenticated: false,
    role: null,
    user: null,
    schoolCode: null,
    schoolPhoto: null,
    loading: true,
  });

  // SlideMenu reset callback'i için ref (state yerine ref kullan - daha stabil)
  const slideMenuResetCallbackRef = React.useRef(null);
  
  const setSlideMenuResetCallback = React.useCallback((callback) => {
    slideMenuResetCallbackRef.current = callback;
  }, []);

  const clearSession = async () => {
    // SlideMenu state'ini temizle (eğer callback varsa)
    if (slideMenuResetCallbackRef.current) {
      slideMenuResetCallbackRef.current();
    }
    
    // FCM logout işlemi - user bilgisi varsa
    if (session.user && global.handleFCMLogout) {
      let userId = null;
      if (session.user.OgretmenID) {
        userId = session.user.OgretmenID;
      } else if (session.user.OgrenciId) {
        userId = session.user.OgrenciId;
      } else if (session.user.AdminID) {
        userId = session.user.AdminID;
      }
      
      if (userId) {
        await global.handleFCMLogout(userId);
      }
    }
    
    await Promise.all([
      setToken(null),
      setRefreshToken(null),
      setRole(null),
      setUser(null),
      setSchoolCode(null), // Okul kodunu da temizle
      setSchoolPhoto(null), // Okul fotoğrafını da temizle
    ]);
    setSessionState({
      isAuthenticated: false,
      role: null,
      user: null,
      schoolCode: null, // Okul kodunu state'te de null yap
      schoolPhoto: null, // Okul fotoğrafını state'te de null yap
      loading: false,
    });
  };

  useEffect(() => {
    // Register clear session callback with API interceptor
    setSessionClearCallback(clearSession);

    const restore = async () => {
      const [token, role, user, schoolCode, schoolPhoto] = await Promise.all([
        getToken(),
        getRole(),
        getUser(),
        getSchoolCode(),
        getSchoolPhoto(),
      ]);
      if (token && role) {
        setSessionState({
          isAuthenticated: true,
          role,
          user,
          schoolCode,
          schoolPhoto,
          loading: false,
        });
      } else {
        setSessionState((prev) => ({
          ...prev,
          schoolCode, // Keep schoolCode even if not authenticated
          schoolPhoto, // Keep schoolPhoto even if not authenticated
          loading: false,
        }));
      }
    };
    restore();
  }, []);

  const setSession = async ({
    accessToken,
    refreshToken,
    role,
    user,
    schoolCode,
  }) => {
    if (accessToken) await setToken(accessToken);
    if (refreshToken) await setRefreshToken(refreshToken);
    if (role) await setRole(role);
    if (user) await setUser(user);
    if (schoolCode) await setSchoolCode(schoolCode);

    // Only set isAuthenticated to true if we have access token and role
    if (accessToken && role) {
      setSessionState({
        isAuthenticated: true,
        role,
        user,
        schoolCode,
        loading: false,
      });
    } else {
      // If only schoolCode is being set, don't change authentication state
      setSessionState((prev) => ({ ...prev, schoolCode }));
    }
  };

  const updateSchoolCode = async (schoolCode, schoolPhoto = null) => {
    await setSchoolCode(schoolCode);
    if (schoolPhoto) {
      await setSchoolPhoto(schoolPhoto);
    }
    setSessionState((prev) => ({ ...prev, schoolCode, schoolPhoto: schoolPhoto || prev.schoolPhoto }));
  };

  return (
    <SessionContext.Provider
      value={{ ...session, setSession, updateSchoolCode, clearSession, setSlideMenuResetCallback }}
    >
      {children}
    </SessionContext.Provider>
  );
};
