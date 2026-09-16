import { useContext, useEffect, useState } from 'react';
import { apiRequest, getApiErrorMessage } from '../api';
import { UserContext } from '../context/auth';
import { historyRange } from './data';

export function useHistory(path, range, refresh = 0) {
  const { user, expireSession } = useContext(UserContext);
  const [result, setResult] = useState({
    key: '',
    data: null,
    loading: false,
    error: '',
  });
  const token = user?.token;
  const key = `${path}:${range}:${refresh}:${token}`;
  useEffect(() => {
    if (!path || !token) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      ...historyRange(range),
      limit: '1000',
    });
    setResult({ key, data: null, loading: true, error: '' });
    apiRequest(`${path}?${query}`, { token, signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ key, data, loading: false, error: '' });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.status === 401) expireSession(token);
        setResult({
          key,
          data: null,
          loading: false,
          error: getApiErrorMessage(error),
        });
      });
    return () => controller.abort();
  }, [path, range, refresh, token, expireSession, key]);
  return result.key === key
    ? result
    : { data: null, loading: Boolean(path && token), error: '' };
}
