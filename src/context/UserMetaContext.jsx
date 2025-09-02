import React, { createContext, useContext, useState } from "react";

const UserMetaContext = createContext();

export function UserMetaProvider({ children }) {
  const [userMeta, setUserMeta] = useState({ full_name: "", avatar_url: "" });

  const updateUserMeta = (meta) => {
    setUserMeta((prev) => ({ ...prev, ...meta }));
  };

  return (
    <UserMetaContext.Provider value={{ userMeta, updateUserMeta }}>
      {children}
    </UserMetaContext.Provider>
  );
}

export function useUserMeta() {
  return useContext(UserMetaContext);
}
