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
    invalid('The ID must be a whole number from 0 to 95.');
  if (!data.location?.trim()) invalid('Enter the device location.');
  if (!Array.isArray(devices))
    invalid(
      'Unable to check whether the ID is available. Please try again.',
    );
  if (devices.some((device) => Number(device.deviceId) === deviceId))
    invalid(
      'This ID is already in use. Choose another to preserve the existing device.',
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
    invalid('Complete all required fields.');
  if (data.password !== data.confirmPassword)
    invalid('Passwords must match.');
  return {
    name: data.name.trim(),
    email: data.email.trim(),
    role: data.role.trim(),
    password: data.password,
  };
}
