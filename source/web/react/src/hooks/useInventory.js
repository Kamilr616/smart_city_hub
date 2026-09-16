import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from '../context/auth';
import { apiRequest, getApiErrorMessage } from '../api';

const paths = {
  devices: '/device/user/get',
  states: '/state/user/latest',
  sensors: '/sensor/catalog',
  readings: '/sensor/all/latest',
};
export function useInventory() {
  const { user, expireSession } = useContext(UserContext);
  const [data, setData] = useState({
    devices: [],
    states: [],
    sensors: [],
    readings: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(null);
  const controller = useRef(null);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setLoading(true);
    const results = await Promise.all(
      Object.entries(paths).map(async ([key, path]) => {
        try {
          const value = await apiRequest(path, {
            token: user.token,
            signal: next.signal,
          });
          if (!Array.isArray(value))
            throw new Error('Nieprawidłowa odpowiedź API.');
          return { key, value };
        } catch (error) {
          return { key, error };
        }
      }),
    );
    if (next.signal.aborted) return;
    if (results.some((result) => result.error?.status === 401)) {
      expireSession(user.token);
      return;
    }
    setData((previous) => {
      const values = { ...previous };
      for (const result of results)
        if (!result.error) values[result.key] = result.value;
      return values;
    });
    setErrors(
      Object.fromEntries(
        results
          .filter((result) => result.error)
          .map((result) => [result.key, getApiErrorMessage(result.error)]),
      ),
    );
    setLoading(false);
    setUpdated(new Date());
  }, [user.token, expireSession]);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => {
      clearInterval(timer);
      controller.current?.abort();
    };
  }, [refresh]);
  const isAdmin = Boolean(user.isAdmin || user.role === 'admin');
  const sensors = data.sensors.filter(
    (item) => isAdmin || item.location === user.role,
  );
  return { ...data, sensors, errors, loading, updated, refresh };
}
