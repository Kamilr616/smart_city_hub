import { Buffer } from 'node:buffer';
import { expect, test } from '@playwright/test';
const devices = [
  {
    deviceId: 0,
    name: 'Pet Shop',
    location: 'city',
    type: 'light',
    description: 'Oświetlenie sklepu',
  },
  {
    deviceId: 1,
    name: 'Latarnia portowa',
    location: 'harbour',
    type: 'lamp',
    description: 'Oświetlenie portu',
  },
  {
    deviceId: 2,
    name: 'Wentylator',
    location: 'city',
    type: 'fan',
    description: 'Dach garażu',
  },
];
const sensors = [
  {
    deviceId: 0,
    name: 'Stacja pogodowa',
    location: 'city',
    description: 'Pomiary ulicy',
  },
  {
    deviceId: 1,
    name: 'Czujnik przy garażu',
    location: 'city',
    description: 'Pomiary garażu',
  },
];
const token = (claims = {}) =>
  Buffer.from('{}').toString('base64url') +
  '.' +
  Buffer.from(
    JSON.stringify({
      role: 'admin',
      isAdmin: true,
      userId: 'test',
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...claims,
    }),
  ).toString('base64url') +
  '.test';
async function setup(page, claims = {}) {
  const jwt = token(claims);
  await page.addInitScript(
    (value) => sessionStorage.setItem('user', JSON.stringify({ token: value })),
    jwt,
  );
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const now = new Date().toISOString();
    if (path.endsWith('/user/auth'))
      return route.fulfill({ json: { token: jwt } });
    if (path.endsWith('/device/user/get'))
      return route.fulfill({
        json:
          claims.role === 'city'
            ? devices.filter((d) => d.location === 'city')
            : devices,
      });
    if (path.endsWith('/state/user/latest'))
      return route.fulfill({
        json: [
          { deviceId: 0, state: true, timestamp: now },
          { deviceId: 1, state: false, timestamp: now },
        ],
      });
    if (path.endsWith('/sensor/catalog'))
      return route.fulfill({ json: sensors });
    if (path.endsWith('/sensor/all/latest'))
      return route.fulfill({
        json: [
          {
            deviceId: 0,
            temperature: 22.4,
            humidity: 45,
            pressure: 1012,
            readingDate: now,
          },
          { deviceId: 1 },
        ],
      });
    if (path.includes('/sensor/history/')) {
      const id = Number(path.split('/').at(-1));
      const end = Date.parse(url.searchParams.get('to'));
      return route.fulfill({
        json: {
          deviceId: id,
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          truncated: false,
          readings:
            id === 0
              ? [
                  {
                    deviceId: 0,
                    temperature: 20,
                    humidity: 44,
                    pressure: 1011,
                    readingDate: new Date(end - 1800000).toISOString(),
                  },
                  {
                    deviceId: 0,
                    temperature: 22.4,
                    humidity: 45,
                    pressure: 1012,
                    readingDate: new Date(end).toISOString(),
                  },
                ]
              : [],
        },
      });
    }
    if (path.includes('/state/history/'))
      return route.fulfill({
        json: {
          deviceId: Number(path.split('/').at(-1)),
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          initialState: false,
          truncated: false,
          states: [
            {
              state: true,
              timestamp: new Date(Date.now() - 1800000).toISOString(),
            },
            { state: false, timestamp: url.searchParams.get('to') },
          ],
        },
      });
    if (path.endsWith('/state/user/update'))
      return route.fulfill({ json: { message: 'Updated' } });
    if (path.endsWith('/user/logout'))
      return route.fulfill({ json: { message: 'Logged out' } });
    return route.fulfill({ status: 404, json: { error: 'Unhandled fixture' } });
  });
}
test('overview and locations show available roles without inert navigation', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Devices', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Control Panel', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Locations', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'city', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'harbour', exact: true }),
  ).toBeVisible();
});
test('device filters reset and missing state remains unknown', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/devices');
  await expect(page.getByText('Brak stanu', { exact: true })).toBeVisible();
  await page.getByLabel('Lokalizacja').selectOption('harbour');
  await expect(
    page.getByText('Latarnia portowa', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Pet Shop', { exact: true })).toHaveCount(0);
  await page.getByLabel('Lokalizacja').selectOption('');
  await expect(page.getByText('Pet Shop', { exact: true })).toBeVisible();
});
test('device history uses stored states and exposes table', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/devices');
  await page.getByRole('button', { name: 'Historia: Pet Shop' }).click();
  await expect(
    page.getByRole('heading', { name: /Historia.*Pet Shop/ }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByText('Pokaż historię w tabeli').click();
  await expect(page.getByRole('table')).toBeVisible();
});
test('sensors show actual measurements and empty history distinctly', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/sensors');
  await expect(page.getByText('22,4 °C', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByLabel('Czujnik', { exact: true }).selectOption('1');
  await expect(
    page.getByText(/Brak pomiarów w wybranym okresie/),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});
test('ordinary users only see their city and no admin forms', async ({
  page,
}) => {
  await setup(page, { role: 'city', isAdmin: false });
  await page.goto('/locations');
  await expect(
    page.getByRole('heading', { name: 'city', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'harbour', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Dodaj urządzenie', exact: true }),
  ).toHaveCount(0);
  await page.goto('/users/new');
  await expect(
    page.getByRole('heading', { name: 'Nowy użytkownik' }),
  ).toHaveCount(0);
});
test('expired session returns to login', async ({ page }) => {
  await setup(page, { exp: 1 });
  await page.goto('/devices');
  await expect(page.getByLabel('Nazwa użytkownika lub e-mail')).toBeVisible();
});
test('failed fetch shows recovery instead of an endless spinner', async ({
  page,
}) => {
  await setup(page);
  await page.route('**/api/device/user/get', (route) =>
    route.fulfill({ status: 503, json: { error: 'Unavailable' } }),
  );
  await page.goto('/devices');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: /Odśwież/ })).toBeVisible();
});
test('desktop and mobile layout remain usable', async ({ page }, testInfo) => {
  await setup(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Przegląd' })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('overview-desktop.png'),
    fullPage: true,
  });
  await page.goto('/sensors');
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('sensors-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/devices');
  await expect(
    page.getByRole('button', { name: 'Historia: Pet Shop' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Historia: Pet Shop' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: testInfo.outputPath('devices-mobile.png'),
    fullPage: true,
  });
  await page.goto('/sensors');
  await expect(page.locator('canvas')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await expect(
    page.getByLabel('Parametr wykresu', { exact: true }),
  ).toHaveValue('temperature');
  await page.screenshot({
    path: testInfo.outputPath('sensors-mobile.png'),
    fullPage: true,
  });
  await page
    .getByLabel('Parametr wykresu', { exact: true })
    .selectOption('all');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test('sensor demo is optional, labeled and never writes measurements', async ({
  page,
}) => {
  await setup(page);
  let writes = 0;
  page.on('request', (r) => {
    if (r.url().includes('/api/') && r.method() === 'POST') writes++;
  });
  await page.goto('/sensors?sensor=1');
  const toggle = page.getByRole('checkbox', {
    name: 'Tryb demonstracyjny (DEMO)',
  });
  await expect(toggle).not.toBeChecked();
  await expect(page.getByLabel('Czujnik', { exact: true })).toHaveValue('1');
  await expect(
    page.getByText(/Brak pomiarów w wybranym okresie/),
  ).toBeVisible();
  await toggle.check();
  await expect(
    page.getByRole('heading', { name: 'DEMO · Przykładowy wykres' }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('aria-label', /^DEMO/);
  await page.getByLabel('Zakres czasu', { exact: true }).selectOption('7d');
  await page.getByText('Pokaż pomiary w tabeli').click();
  await expect(page.getByRole('table')).toContainText('DEMO');
  await toggle.uncheck();
  await expect(
    page.getByText(/Brak pomiarów w wybranym okresie/),
  ).toBeVisible();
  expect(writes).toBe(0);
});
test('login accepts a username and unauthorized requests end the session', async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() => sessionStorage.clear());
  await page.goto('/login');
  await page.getByLabel('Nazwa użytkownika lub e-mail').fill('operator');
  await page.getByLabel('Hasło', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Przegląd' })).toBeVisible();
  await page.route('**/api/device/user/get', (route) =>
    route.fulfill({ status: 401, json: { error: 'Expired' } }),
  );
  await page.getByRole('link', { name: 'Devices', exact: true }).click();
  await page.getByRole('button', { name: 'Odśwież', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Zaloguj się', exact: true }),
  ).toBeVisible();
});
test('device write disables repeat requests while pending', async ({
  page,
}) => {
  await setup(page);
  let calls = 0,
    held,
    historyCalls = 0;
  page.on('request', (r) => {
    if (r.url().includes('/state/history/0')) historyCalls++;
  });
  await page.route('**/api/state/user/update', (route) => {
    calls++;
    held = route;
  });
  await page.goto('/devices');
  await page.getByRole('button', { name: 'Historia: Pet Shop' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  const before = historyCalls;
  const button = page.getByRole('button', {
    name: 'Wyłącz: Pet Shop',
    exact: true,
  });
  await button.click();
  await expect(button).toBeDisabled();
  await expect.poll(() => calls).toBe(1);
  await held.fulfill({ json: { message: 'Updated' } });
  await expect(button).toBeEnabled();
  await expect(page.getByRole('status')).toContainText('zapisany');
  expect(calls).toBe(1);
  await expect.poll(() => historyCalls).toBeGreaterThan(before);
});
test('adding a device protects existing metadata and refreshes the list', async ({
  page,
}) => {
  await setup(page);
  const catalog = [...devices];
  let writes = 0;
  await page.route('**/api/device/user/get', (route) =>
    route.fulfill({ json: catalog }),
  );
  await page.route('**/api/device/0', (route) =>
    route.fulfill({ json: [devices[0]] }),
  );
  await page.route('**/api/device/3', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/device/update', (route) => {
    writes++;
    catalog.push(route.request().postDataJSON());
    return route.fulfill({ json: { message: 'Saved' } });
  });
  await page.goto('/devices/new');
  await page.getByLabel('Identyfikator urządzenia').fill('0');
  await page.getByLabel('Nazwa urządzenia').fill('Testowa latarnia');
  await page.getByLabel('Lokalizacja', { exact: true }).fill('city');
  await page.getByLabel('Typ urządzenia').fill('lamp');
  await page
    .getByRole('button', { name: 'Dodaj urządzenie', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('już zajęty');
  expect(writes).toBe(0);
  await page.getByLabel('Identyfikator urządzenia').fill('3');
  await page
    .getByRole('button', { name: 'Dodaj urządzenie', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('dodane');
  await page.getByRole('link', { name: 'Devices', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Testowa latarnia', exact: true }),
  ).toBeVisible();
  expect(writes).toBe(1);
});
