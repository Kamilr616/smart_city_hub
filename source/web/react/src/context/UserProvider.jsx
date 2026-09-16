import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { apiRequest, subscribeUnauthorized } from '../api';
import { UserContext } from './auth';
import { loadStoredUser, parseSession } from './session';

function getStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, updateUser] = useState(() => loadStoredUser(getStorage()));
  const currentUser = useRef(user);

  const expireSession = useCallback((token) => {
    if (token && currentUser.current?.token !== token) return;
    currentUser.current = null;
    updateUser(null);
    try {
      getStorage()?.removeItem('user');
    } catch {
      /* Local state still clears. */
    }
  }, []);

  const setUser = useCallback(
    (data) => {
      const session = parseSession(data);
      if (!session) {
        expireSession();
        throw Object.assign(
          new Error('Nieprawidłowa lub wygasła sesja. Zaloguj się ponownie.'),
          { code: 'VALIDATION' },
        );
      }
      currentUser.current = session;
      updateUser(session);
      try {
        getStorage()?.setItem('user', JSON.stringify({ token: session.token }));
      } catch {
        /* Session remains usable in memory. */
      }
    },
    [expireSession],
  );

  const logout = useCallback(async () => {
    const token = currentUser.current?.token;
    expireSession();
    if (!token) return;
    try {
      await apiRequest('/user/logout', { method: 'DELETE', token });
    } catch {
      /* Local logout must complete even when the API is unavailable. */
    }
  }, [expireSession]);

  useEffect(() => subscribeUnauthorized(expireSession), [expireSession]);
  useEffect(() => {
    if (!user) return;
    let timer;
    const checkExpiry = () => {
      clearTimeout(timer);
      const remaining = user.exp * 1000 - Date.now();
      if (remaining <= 0) expireSession(user.token);
      else timer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    };
    checkExpiry();
    window.addEventListener('focus', checkExpiry);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', checkExpiry);
    };
  }, [user, expireSession]);

  return (
    <UserContext.Provider value={{ user, setUser, logout, expireSession }}>
      {children}
    </UserContext.Provider>
  );
}

UserProvider.propTypes = { children: PropTypes.node.isRequired };
