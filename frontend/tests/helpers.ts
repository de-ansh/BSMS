import { APIRequestContext, expect } from '@playwright/test';

export async function createAdminAndGetCredentials(request: APIRequestContext) {
  const time = Date.now();
  const buildingName = `Bldg ${time}`;
  const buildingCode = `bldg-${time}`;
  const adminEmail = `admin-${time}@test.com`;
  const adminPassword = `password-${time}`;

  // 1. Login as Super Admin to get token
  const loginRes = await request.post('http://localhost:8000/auth/login', {
    data: {
      email: 'superadmin@bsms.com',
      password: 'superadmin123',
      role: 'super_admin'
    }
  });
  expect(loginRes.ok()).toBeTruthy();
  const { access_token } = await loginRes.json();

  // 2. Create Building
  const bldgRes = await request.post('http://localhost:8000/super-admin/buildings', {
    headers: {
      'Authorization': `Bearer ${access_token}`
    },
    data: {
      name: buildingName,
      code: buildingCode,
      address: '123 E2E Test St',
      city: 'Testville',
      state: 'TS',
      postal_code: '12345'
    }
  });
  expect(bldgRes.ok()).toBeTruthy();
  const { id: buildingId } = await bldgRes.json();

  // 3. Create Admin for this building
  const adminRes = await request.post(`http://localhost:8000/super-admin/buildings/${buildingId}/admins`, {
    headers: {
      'Authorization': `Bearer ${access_token}`
    },
    data: {
      name: 'Test Admin',
      email: adminEmail,
      password: adminPassword
    }
  });
  expect(adminRes.ok()).toBeTruthy();

  return {
    email: adminEmail,
    password: adminPassword,
    buildingId,
    buildingName
  };
}

export async function createAdminUnitAndMember(request: APIRequestContext) {
  const admin = await createAdminAndGetCredentials(request);

  // 1. Login as Admin
  const adminLoginRes = await request.post('http://localhost:8000/auth/login', {
    data: {
      email: admin.email,
      password: admin.password,
      role: 'admin'
    }
  });
  expect(adminLoginRes.ok()).toBeTruthy();
  const { access_token: adminToken } = await adminLoginRes.json();

  const time = Date.now();
  const unitNumber = `U-${Math.floor(Math.random() * 10000)}`;

  // 2. Create Unit
  const unitRes = await request.post('http://localhost:8000/units/', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    data: {
      unit_number: unitNumber,
      floor: 1,
      bedrooms: 2,
      bathrooms: 2,
      maintenance_fee: 150,
      status: 'vacant'
    }
  });
  expect(unitRes.ok()).toBeTruthy();
  const { id: unitId } = await unitRes.json();

  // 3. Create Member
  const memberEmail = `res-${time}@test.com`;
  const memberName = `Resident ${time}`;
  const memberRes = await request.post('http://localhost:8000/members/', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    data: {
      name: memberName,
      email: memberEmail,
      phone: '1234567890',
      password: 'resident123',
      unit_id: unitId,
      is_owner: true
    }
  });
  expect(memberRes.ok()).toBeTruthy();
  const { id: memberId } = await memberRes.json();

  return {
    admin,
    unit: { id: unitId, unitNumber },
    member: { id: memberId, name: memberName, email: memberEmail }
  };
}
