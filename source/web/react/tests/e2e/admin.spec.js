import { Buffer } from 'node:buffer';
import { test, expect } from '@playwright/test';
const selfId = '111111111111111111111111';
const otherId = '222222222222222222222222';
async function setup(page, regular = false) {
  const jwt =
    Buffer.from('{}').toString('base64url') +
    '.' +
    Buffer.from(
      JSON.stringify({
        userId: selfId,
        role: regular ? 'city' : 'admin',
        isAdmin: !regular,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url') +
    '.test';
  await page.addInitScript(
    (value) => sessionStorage.setItem('user', JSON.stringify({ token: value })),
    jwt,
  );
  const fixture = {
    devices: [
      {
        deviceId: 0,
        name: 'Pet Shop',
        location: 'city',
        type: 'light',
        description: 'Oświetlenie',
      },
    ],
    users: [
      {
        _id: selfId,
        name: 'admin',
        email: 'admin@example.test',
        role: 'admin',
        isAdmin: true,
        active: true,
      },
      {
        _id: otherId,
        name: 'operator',
        email: 'operator@example.test',
        role: 'city',
        isAdmin: false,
        active: true,
      },
    ],
    keys: [],
    writes: [],
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (['PATCH', 'POST', 'DELETE'].includes(request.method()))
      fixture.writes.push({
        path,
        method: request.method(),
        body: request.postData() ? request.postDataJSON() : null,
      });
    if (path === '/api/device/user/get')
      return route.fulfill({ json: fixture.devices });
    if (path === '/api/state/user/latest')
      return route.fulfill({
        json: [
          { deviceId: 0, state: true, timestamp: new Date().toISOString() },
        ],
      });
    if (path === '/api/sensor/catalog' || path === '/api/sensor/all/latest')
      return route.fulfill({ json: [] });
    if (path === '/api/device/0') {
      if (request.method() === 'PATCH')
        Object.assign(fixture.devices[0], request.postDataJSON());
      return route.fulfill({
        json: request.method() === 'GET' ? fixture.devices : fixture.devices[0],
      });
    }
    if (path === '/api/user/list')
      return route.fulfill({ json: fixture.users });
    if (path === '/api/user/' + otherId && request.method() === 'PATCH') {
      Object.assign(fixture.users[1], request.postDataJSON());
      return route.fulfill({ json: fixture.users[1] });
    }
    if (path === '/api/esp-tokens') {
      if (request.method() === 'POST') {
        const key = {
          id: '333333333333333333333333',
          ...request.postDataJSON(),
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          revokedAt: null,
        };
        fixture.keys.push(key);
        return route.fulfill({
          json: { token: 'sch_fixture-one-time-secret', key },
        });
      }
      return route.fulfill({ json: fixture.keys });
    }
    if (
      path === '/api/esp-tokens/333333333333333333333333' &&
      request.method() === 'DELETE'
    ) {
      fixture.keys[0].revokedAt = new Date().toISOString();
      return route.fulfill({ json: fixture.keys[0] });
    }
    return route.fulfill({ status: 404, json: { error: 'Fixture not found' } });
  });
  return fixture;
}
test('device metadata edit preserves identifier and does not write state', async ({
  page,
}) => {
  const f = await setup(page);
  await page.goto('/devices');
  await page.getByRole('link', { name: 'Edit: Pet Shop' }).click();
  await expect(page.getByLabel('Device ID', { exact: true })).toHaveValue(
    '0',
  );
  await expect(
    page.getByLabel('Device ID', { exact: true }),
  ).not.toBeEditable();
  await page
    .getByLabel('Device name', { exact: true })
    .fill('Sklep zoologiczny');
  await page.getByLabel('Description', { exact: true }).fill('Nowy opis');
  await page
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('saved');
  expect(f.writes).toEqual([
    {
      path: '/api/device/0',
      method: 'PATCH',
      body: {
        name: 'Sklep zoologiczny',
        location: 'city',
        type: 'light',
        description: 'Nowy opis',
      },
    },
  ]);
  await page.getByRole('link', { name: 'Devices', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Sklep zoologiczny', exact: true }),
  ).toBeVisible();
});
test('admin can edit a user and deactivate access without sending an empty password', async ({
  page,
}) => {
  const f = await setup(page);
  await page.goto('/users');
  await page
    .getByRole('button', { name: 'Edit: operator', exact: true })
    .click();
  await page.getByLabel('Username', { exact: true }).fill('operator2');
  await page.getByLabel('Location / role', { exact: true }).fill('harbour');
  await page.getByLabel('Active account', { exact: true }).uncheck();
  await page
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('saved');
  expect(f.writes).toHaveLength(1);
  expect(f.writes[0].body).toMatchObject({
    name: 'operator2',
    role: 'harbour',
    active: false,
  });
  expect(f.writes[0].body).not.toHaveProperty('password');
  await expect(
    page.getByRole('cell', { name: 'operator2', exact: true }),
  ).toBeVisible();
});
test('ordinary users cannot open administration or device editing', async ({
  page,
}) => {
  await setup(page, true);
  for (const path of ['/users', '/esp-tokens', '/devices/0/edit']) {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: 'Overview', exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole('link', { name: 'Users', exact: true }),
  ).toHaveCount(0);
  await page.goto('/devices');
  await expect(
    page.getByRole('link', { name: 'Edit: Pet Shop' }),
  ).toHaveCount(0);
});
test('ESP key is created for a location, shown once and can be revoked', async ({
  page,
}) => {
  const f = await setup(page);
  await page.goto('/esp-tokens');
  await page.getByLabel('Token name', { exact: true }).fill('ESP rynek');
  await page.getByLabel('Location', { exact: true }).selectOption('city');
  await page.getByLabel('Validity (days)', { exact: true }).fill('30');
  await page
    .getByRole('button', { name: 'Generate token', exact: true })
    .click();
  await expect(page.getByLabel('New ESP token', { exact: true })).toHaveValue(
    'sch_fixture-one-time-secret',
  );
  expect(f.writes[0].body).toEqual({
    name: 'ESP rynek',
    location: 'city',
    expiresInDays: 30,
  });
  const persisted = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  expect(persisted).not.toContain('sch_fixture');
  await page.getByRole('link', { name: 'Devices', exact: true }).click();
  await page.getByRole('link', { name: 'ESP tokens', exact: true }).click();
  await expect(page.getByLabel('New ESP token', { exact: true })).toHaveCount(
    0,
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Revoke: ESP rynek', exact: true })
    .click();
  await expect(page.getByText('Revoked', { exact: true })).toBeVisible();
});

test('administration layout works on desktop and mobile', async ({
  page,
}, info) => {
  await setup(page);
  await page.goto('/users');
  await page
    .getByRole('button', { name: 'Edit: operator', exact: true })
    .click();
  await expect(
    page.getByLabel('Username', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('users-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: info.outputPath('users-mobile.png'),
    fullPage: true,
  });
  await page.goto('/esp-tokens');
  await expect(
    page.getByRole('button', { name: 'Generate token', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: info.outputPath('esp-mobile.png'),
    fullPage: true,
  });
});
