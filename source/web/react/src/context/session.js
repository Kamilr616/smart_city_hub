import { jwtDecode } from 'jwt-decode';

export function parseSession(value, now = Date.now()) {
  try {
    if (typeof value?.token !== 'string') return null;
    const claims = jwtDecode(value.token);
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= now) return null;
    return {
      token: value.token,
      name: claims.name,
      role: claims.role,
      userId: claims.userId,
      exp: claims.exp,
      isAdmin: claims.isAdmin === true || claims.role === 'admin',
    };
  } catch {
    return null;
  }
}

export function loadStoredUser(storage) {
  try {
    const user = parseSession(JSON.parse(storage?.getItem('user') || 'null'));
    if (!user) storage?.removeItem('user');
    return user;
  } catch {
    try {
      storage?.removeItem('user');
    } catch {
      /* Storage may be disabled. */
    }
    return null;
  }
}

const invalid = (message) => {
  throw Object.assign(new Error(message), { code: 'VALIDATION' });
};

export function devicePayload(data, devices) {
  const deviceId = Number(data.deviceId);
  if (
    String(data.deviceId).trim() === '' ||
    !Number.isInteger(deviceId) ||
    deviceId < 0 ||
    deviceId > 95
  )
    invalid('Identyfikator musi być liczbą całkowitą od 0 do 95.');
  if (!data.location?.trim()) invalid('Podaj lokalizację urządzenia.');
  if (!Array.isArray(devices))
    invalid(
      'Nie udało się sprawdzić dostępności identyfikatora. Spróbuj ponownie.',
    );
  if (devices.some((device) => Number(device.deviceId) === deviceId))
    invalid(
      'Ten identyfikator jest już zajęty. Wybierz inny, aby zachować istniejące urządzenie.',
    );
  return {
    deviceId,
    location: data.location.trim(),
    name: data.name.trim(),
    type: data.type.trim(),
    description: data.description.trim(),
  };
}

export function userPayload(data) {
  if (
    !data.name.trim() ||
    !data.email.trim() ||
    !data.role.trim() ||
    !data.password
  )
    invalid('Uzupełnij wszystkie wymagane pola.');
  if (data.password !== data.confirmPassword)
    invalid('Hasła muszą być takie same.');
  return {
    name: data.name.trim(),
    email: data.email.trim(),
    role: data.role.trim(),
    password: data.password,
  };
}
