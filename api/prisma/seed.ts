import { PrismaClient, BloodType, IdType, DonorCategory, ProductType, BloodUnitStatus, EventType, EventStatus, CarrierType, DeliveryStatus, FinancialRecordType, FinancialCategory, TestLabType, NotificationType, NotificationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Sanguis...\n');

  // ─── 1. ADMIN USERS ───────────────────────────────────────────────────────
  console.log('👤 Creando usuarios admin...');
  const adminPass = await bcrypt.hash('Admin123!', 12);
  const labPass   = await bcrypt.hash('Lab123!', 12);

  const [superAdmin, labTech] = await Promise.all([
    prisma.adminUser.upsert({
      where: { email: 'admin@sanguis.do' },
      update: {},
      create: { email: 'admin@sanguis.do', passwordHash: adminPass, name: 'Carlos Méndez', role: 'SUPER_ADMIN' },
    }),
    prisma.adminUser.upsert({
      where: { email: 'lab@sanguis.do' },
      update: {},
      create: { email: 'lab@sanguis.do', passwordHash: labPass, name: 'Dra. Ana Rodríguez', role: 'LAB_TECH' },
    }),
  ]);
  console.log(`   ✅ ${superAdmin.email} (SUPER_ADMIN)`);
  console.log(`   ✅ ${labTech.email} (LAB_TECH)\n`);

  // ─── 2. STORAGE LOCATIONS ─────────────────────────────────────────────────
  console.log('🏥 Creando ubicaciones de almacenamiento...');
  const [cdPrincipal, cdNorte] = await Promise.all([
    prisma.storageLocation.upsert({
      where: { id: 'loc-01' },
      update: {},
      create: { id: 'loc-01', name: 'Centro de Distribución Principal', address: 'Av. Independencia 123, Santo Domingo', description: 'CD principal con capacidad para 500 unidades' },
    }),
    prisma.storageLocation.upsert({
      where: { id: 'loc-02' },
      update: {},
      create: { id: 'loc-02', name: 'CD Norte — Santiago', address: 'Calle El Sol 45, Santiago de los Caballeros', description: 'Centro de distribución zona norte' },
    }),
  ]);
  console.log(`   ✅ ${cdPrincipal.name}`);
  console.log(`   ✅ ${cdNorte.name}\n`);

  // ─── 3. EXTERNAL LAB ──────────────────────────────────────────────────────
  console.log('🔬 Creando laboratorio externo...');
  const externalLab = await prisma.externalLab.upsert({
    where: { id: 'lab-01' },
    update: {},
    create: { id: 'lab-01', name: 'BioLab RD S.A.', contactName: 'Dr. Pedro Sánchez', phone: '+1-809-555-0100', email: 'resultados@biolabrd.do' },
  });
  console.log(`   ✅ ${externalLab.name}\n`);

  // ─── 4. DELIVERY PROTOCOLS ────────────────────────────────────────────────
  console.log('📋 Creando protocolos de entrega...');
  const [protoWhole, protoPlatelets] = await Promise.all([
    prisma.deliveryProtocol.upsert({
      where: { id: 'proto-01' },
      update: {},
      create: {
        id: 'proto-01', name: 'Sangre Entera — Estándar',
        requirements: { cooler: true, tempMonitor: true, sealedBag: true },
        tempRangeMinC: 1, tempRangeMaxC: 6, maxTransitHours: 4,
        handlingInstructions: 'Mantener vertical. No agitar. Verificar temperatura cada 30 minutos.',
      },
    }),
    prisma.deliveryProtocol.upsert({
      where: { id: 'proto-02' },
      update: {},
      create: {
        id: 'proto-02', name: 'Plaquetas — Urgente',
        requirements: { agitator: true, tempMonitor: true, roomTemp: true },
        tempRangeMinC: 20, tempRangeMaxC: 24, maxTransitHours: 2,
        handlingInstructions: 'Agitar continuamente. Temperatura ambiente controlada. Máximo 2h de tránsito.',
      },
    }),
  ]);
  console.log(`   ✅ ${protoWhole.name}`);
  console.log(`   ✅ ${protoPlatelets.name}\n`);

  // ─── 5. VEHICLES ──────────────────────────────────────────────────────────
  console.log('🚐 Creando flota vehicular...');
  const vehicle = await prisma.vehicle.upsert({
    where: { id: 'veh-01' },
    update: {},
    create: { id: 'veh-01', plate: 'A-123456', type: 'Van refrigerada', capacityUnits: 50, driverName: 'Juan de los Santos', driverPhone: '+1-809-555-0200' },
  });
  console.log(`   ✅ ${vehicle.plate} — ${vehicle.driverName}\n`);

  // ─── 6. PARTNER ESTABLISHMENTS ────────────────────────────────────────────
  console.log('🏪 Creando establecimientos aliados...');
  const partners = await Promise.all([
    prisma.partnerEstablishment.upsert({
      where: { id: 'partner-01' },
      update: {},
      create: {
        id: 'partner-01', name: 'Farmacia Carol', category: 'Farmacia',
        taxId: '1-01-12345-6', taxDeductionPct: 18,
        address: 'Av. 27 de Febrero, Santo Domingo',
        availableRewards: [{ name: '10% descuento en medicamentos', points: 500 }, { name: '20% descuento', points: 1000 }],
      },
    }),
    prisma.partnerEstablishment.upsert({
      where: { id: 'partner-02' },
      update: {},
      create: {
        id: 'partner-02', name: 'Supermercados La Sirena', category: 'Supermercado',
        taxId: '1-01-67890-1', taxDeductionPct: 18,
        address: 'Multiple sucursales',
        availableRewards: [{ name: 'RD$500 en compras', points: 500 }, { name: 'RD$1,000 en compras', points: 950 }],
      },
    }),
    prisma.partnerEstablishment.upsert({
      where: { id: 'partner-03' },
      update: {},
      create: {
        id: 'partner-03', name: 'Clinica Corominas', category: 'Clínica',
        taxId: '1-01-11111-2', taxDeductionPct: 18,
        address: 'Calle Fantino Falco, Santo Domingo',
        availableRewards: [{ name: 'Consulta médica gratis', points: 2000 }],
      },
    }),
  ]);
  console.log(`   ✅ ${partners.length} establecimientos creados\n`);

  // ─── 7. DONORS ────────────────────────────────────────────────────────────
  console.log('🩸 Creando donantes de prueba...');

  const donorPass = await bcrypt.hash('Donor123!', 12);

  const donorData = [
    { id: 'donor-01', name: 'María García López',       idType: IdType.CEDULA,   idNumber: '001-1234567-1', phone: '+1-809-555-1001', email: 'maria@email.com',   bloodType: BloodType.O_POSITIVE,  rhFactor: true,  category: DonorCategory.VIP,       totalDonations: 8, pointsBalance: 850, isPriorityDonor: true  },
    { id: 'donor-02', name: 'José Martínez Reyes',      idType: IdType.CEDULA,   idNumber: '001-2345678-2', phone: '+1-809-555-1002', email: 'jose@email.com',    bloodType: BloodType.A_POSITIVE,  rhFactor: true,  category: DonorCategory.RECURRENT, totalDonations: 4, pointsBalance: 450, isPriorityDonor: true  },
    { id: 'donor-03', name: 'Carmen Rodríguez Díaz',    idType: IdType.CEDULA,   idNumber: '001-3456789-3', phone: '+1-829-555-1003', email: 'carmen@email.com',  bloodType: BloodType.B_NEGATIVE,  rhFactor: false, category: DonorCategory.RECURRENT, totalDonations: 3, pointsBalance: 300, isPriorityDonor: false },
    { id: 'donor-04', name: 'Pedro Álvarez Cruz',       idType: IdType.CEDULA,   idNumber: '001-4567890-4', phone: '+1-849-555-1004', email: null,                bloodType: BloodType.AB_POSITIVE, rhFactor: true,  category: DonorCategory.CASUAL,    totalDonations: 1, pointsBalance: 100, isPriorityDonor: false },
    { id: 'donor-05', name: 'Lucía Fernández Torres',   idType: IdType.CEDULA,   idNumber: '001-5678901-5', phone: '+1-809-555-1005', email: 'lucia@email.com',   bloodType: BloodType.O_NEGATIVE,  rhFactor: false, category: DonorCategory.VIP,       totalDonations: 7, pointsBalance: 1200, isPriorityDonor: true },
    { id: 'donor-06', name: 'Roberto Pena Guerrero',    idType: IdType.CEDULA,   idNumber: '001-6789012-6', phone: '+1-809-555-1006', email: 'roberto@email.com', bloodType: BloodType.A_NEGATIVE,  rhFactor: false, category: DonorCategory.CASUAL,    totalDonations: 2, pointsBalance: 200, isPriorityDonor: false },
    { id: 'donor-07', name: 'Ana Rosario Melo',         idType: IdType.CEDULA,   idNumber: '001-7890123-7', phone: '+1-829-555-1007', email: 'ana@email.com',     bloodType: BloodType.B_POSITIVE,  rhFactor: true,  category: DonorCategory.RECURRENT, totalDonations: 5, pointsBalance: 600, isPriorityDonor: true  },
    { id: 'donor-08', name: 'Michael Johnson',          idType: IdType.PASSPORT, idNumber: 'US-123456789',  phone: '+1-809-555-1008', email: 'michael@email.com', bloodType: BloodType.O_POSITIVE,  rhFactor: true,  category: DonorCategory.CASUAL,    totalDonations: 1, pointsBalance: 100, isPriorityDonor: false },
  ];

  for (const d of donorData) {
    const lastDonation = new Date();
    lastDonation.setDate(lastDonation.getDate() - Math.floor(Math.random() * 90 + 10));

    await prisma.donor.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        name: d.name,
        idType: d.idType,
        idNumber: d.idNumber,
        phone: d.phone,
        email: d.email ?? undefined,
        bloodType: d.bloodType,
        rhFactor: d.rhFactor,
        passwordHash: donorPass,
        category: d.category,
        totalDonations: d.totalDonations,
        lastDonationDate: lastDonation,
        isPriorityDonor: d.isPriorityDonor,
        pointsBalance: d.pointsBalance,
        availableTimes: { lunes: ['08:00-12:00'], miercoles: ['14:00-18:00'], sabado: ['08:00-14:00'] },
      },
    });
  }
  console.log(`   ✅ ${donorData.length} donantes creados\n`);

  // ─── 8. BLOOD UNITS ───────────────────────────────────────────────────────
  console.log('💉 Creando unidades de sangre...');

  const bloodUnitsData = [
    { id: 'bu-01', donorId: 'donor-01', bagNumber: 'SNG-2026-0001', bloodType: BloodType.O_POSITIVE,  rhFactor: true,  productType: ProductType.WHOLE_BLOOD, volumeMl: 450, status: BloodUnitStatus.STORED,    daysAgo: 30, storageLocationId: 'loc-01', shelf: 'A-01' },
    { id: 'bu-02', donorId: 'donor-02', bagNumber: 'SNG-2026-0002', bloodType: BloodType.A_POSITIVE,  rhFactor: true,  productType: ProductType.WHOLE_BLOOD, volumeMl: 450, status: BloodUnitStatus.STORED,    daysAgo: 20, storageLocationId: 'loc-01', shelf: 'A-02' },
    { id: 'bu-03', donorId: 'donor-03', bagNumber: 'SNG-2026-0003', bloodType: BloodType.B_NEGATIVE,  rhFactor: false, productType: ProductType.PLATELETS,   volumeMl: 300, status: BloodUnitStatus.STORED,    daysAgo: 2,  storageLocationId: 'loc-01', shelf: 'B-01' },
    { id: 'bu-04', donorId: 'donor-04', bagNumber: 'SNG-2026-0004', bloodType: BloodType.AB_POSITIVE, rhFactor: true,  productType: ProductType.PLASMA,      volumeMl: 250, status: BloodUnitStatus.STORED,    daysAgo: 60, storageLocationId: 'loc-02', shelf: 'C-01' },
    { id: 'bu-05', donorId: 'donor-05', bagNumber: 'SNG-2026-0005', bloodType: BloodType.O_NEGATIVE,  rhFactor: false, productType: ProductType.WHOLE_BLOOD, volumeMl: 450, status: BloodUnitStatus.STORED,    daysAgo: 15, storageLocationId: 'loc-01', shelf: 'A-03' },
    { id: 'bu-06', donorId: 'donor-06', bagNumber: 'SNG-2026-0006', bloodType: BloodType.A_NEGATIVE,  rhFactor: false, productType: ProductType.WHOLE_BLOOD, volumeMl: 450, status: BloodUnitStatus.TESTING,   daysAgo: 1,  storageLocationId: null,     shelf: null  },
    { id: 'bu-07', donorId: 'donor-07', bagNumber: 'SNG-2026-0007', bloodType: BloodType.B_POSITIVE,  rhFactor: true,  productType: ProductType.PLATELETS,   volumeMl: 300, status: BloodUnitStatus.APPROVED,  daysAgo: 3,  storageLocationId: 'loc-01', shelf: 'B-02' },
    { id: 'bu-08', donorId: 'donor-01', bagNumber: 'SNG-2026-0008', bloodType: BloodType.O_POSITIVE,  rhFactor: true,  productType: ProductType.WHOLE_BLOOD, volumeMl: 450, status: BloodUnitStatus.USED,      daysAgo: 90, storageLocationId: null,     shelf: null, usedNote: 'Cirugía cardiovascular — Paciente anonimizado. Centro Médico Las Américas.' },
    { id: 'bu-09', donorId: 'donor-08', bagNumber: 'SNG-2026-0009', bloodType: BloodType.O_POSITIVE,  rhFactor: true,  productType: ProductType.WHOLE_BLOOD, volumeMl: 450, status: BloodUnitStatus.REJECTED,  daysAgo: 5,  storageLocationId: null,     shelf: null  },
    { id: 'bu-10', donorId: 'donor-05', bagNumber: 'SNG-2026-0010', bloodType: BloodType.O_NEGATIVE,  rhFactor: false, productType: ProductType.PLASMA,      volumeMl: 250, status: BloodUnitStatus.QUARANTINE, daysAgo: 1,  storageLocationId: 'loc-01', shelf: 'C-02' },
  ];

  for (const u of bloodUnitsData) {
    const collectionDate = new Date();
    collectionDate.setDate(collectionDate.getDate() - u.daysAgo);

    // Expiration based on product type
    const expirationDays = { WHOLE_BLOOD: 35, PLATELETS: 5, PLASMA: 365 }[u.productType];
    const expirationDate = new Date(collectionDate);
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    await prisma.bloodUnit.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        donorId: u.donorId,
        bagNumber: u.bagNumber,
        bloodType: u.bloodType,
        rhFactor: u.rhFactor,
        productType: u.productType,
        volumeMl: u.volumeMl,
        status: u.status,
        collectionDate,
        expirationDate,
        storageLocationId: u.storageLocationId ?? undefined,
        storageShelf: u.shelf ?? undefined,
        usedAt: u.status === BloodUnitStatus.USED ? new Date() : undefined,
        usedForNote: u.usedNote ?? undefined,
      },
    });
  }
  console.log(`   ✅ ${bloodUnitsData.length} unidades de sangre creadas\n`);

  // ─── 9. TEST RESULTS ──────────────────────────────────────────────────────
  console.log('🧪 Creando resultados de tests...');

  const viableResults = {
    HBsAg: 'negative', 'HIV-1/2': 'negative', HCV: 'negative',
    'HTLV-I/II': 'negative', Syphilis: 'negative', Chagas: 'negative',
    Hemoglobin: 14.2, Hematocrit: 42, Platelets: 250000,
  };
  const rejectedResults = {
    HBsAg: 'positive', 'HIV-1/2': 'negative', HCV: 'negative',
    Syphilis: 'negative', Hemoglobin: 14.0,
  };

  const testData = [
    { id: 'test-01', bloodUnitId: 'bu-01', labType: TestLabType.OWN,      isViable: true,  results: viableResults,   daysAgo: 28 },
    { id: 'test-02', bloodUnitId: 'bu-02', labType: TestLabType.OWN,      isViable: true,  results: viableResults,   daysAgo: 18 },
    { id: 'test-03', bloodUnitId: 'bu-03', labType: TestLabType.EXTERNAL, isViable: true,  results: viableResults,   daysAgo: 1,  externalLabId: 'lab-01' },
    { id: 'test-04', bloodUnitId: 'bu-05', labType: TestLabType.OWN,      isViable: true,  results: viableResults,   daysAgo: 13 },
    { id: 'test-05', bloodUnitId: 'bu-07', labType: TestLabType.OWN,      isViable: true,  results: viableResults,   daysAgo: 2  },
    { id: 'test-06', bloodUnitId: 'bu-08', labType: TestLabType.OWN,      isViable: true,  results: viableResults,   daysAgo: 88 },
    { id: 'test-07', bloodUnitId: 'bu-09', labType: TestLabType.OWN,      isViable: false, results: rejectedResults, daysAgo: 4  },
    { id: 'test-08', bloodUnitId: 'bu-10', labType: TestLabType.EXTERNAL, isViable: true,  results: viableResults,   daysAgo: 1,  externalLabId: 'lab-01', pending: true },
    { id: 'test-09', bloodUnitId: 'bu-06', labType: TestLabType.OWN,      isViable: null,  results: null,            daysAgo: 1,  pending: true },
  ];

  for (const t of testData) {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() - t.daysAgo);
    const resultDate = t.pending ? null : new Date(testDate.getTime() + 3600000 * 4); // 4h after

    await prisma.testResult.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        bloodUnitId: t.bloodUnitId,
        labType: t.labType,
        externalLabId: t.externalLabId ?? undefined,
        technicianId: t.pending ? undefined : labTech.id,
        testDate,
        resultDate: resultDate ?? undefined,
        results: t.results ?? undefined,
        isViable: t.isViable ?? undefined,
        sharedWithDonor: !t.pending && t.isViable === true,
        sharedAt: (!t.pending && t.isViable === true) ? resultDate ?? undefined : undefined,
      },
    });
  }
  console.log(`   ✅ ${testData.length} tests creados (2 pendientes)\n`);

  // ─── 10. DONATION EVENTS ──────────────────────────────────────────────────
  console.log('📅 Creando eventos de donación...');

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek  = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek  = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);

  const events = await Promise.all([
    prisma.donationEvent.upsert({
      where: { id: 'event-01' },
      update: {},
      create: {
        id: 'event-01', name: 'Jornada de Donación — Plaza Central',
        type: EventType.FIXED, locationAddress: 'Plaza Central, Santo Domingo',
        latitude: 18.4746, longitude: -69.9312,
        startDatetime: new Date(tomorrow.setHours(8, 0, 0)),
        endDatetime:   new Date(tomorrow.setHours(16, 0, 0)),
        capacity: 80, registeredCount: 23, status: EventStatus.SCHEDULED,
        description: 'Gran jornada de donación en el corazón de Santo Domingo. Trae tu cédula.',
      },
    }),
    prisma.donationEvent.upsert({
      where: { id: 'event-02' },
      update: {},
      create: {
        id: 'event-02', name: 'Camión Sanguis — UASD',
        type: EventType.MOBILE_TRUCK, locationAddress: 'Universidad Autónoma de Santo Domingo (UASD)',
        latitude: 18.4670, longitude: -69.9440,
        startDatetime: new Date(nextWeek.setHours(9, 0, 0)),
        endDatetime:   new Date(nextWeek.setHours(15, 0, 0)),
        capacity: 40, registeredCount: 12, status: EventStatus.SCHEDULED,
        description: 'Camión de donación en los predios de la UASD.',
      },
    }),
    prisma.donationEvent.upsert({
      where: { id: 'event-03' },
      update: {},
      create: {
        id: 'event-03', name: 'Jornada Hospital Darío Contreras',
        type: EventType.FIXED, locationAddress: 'Hospital Darío Contreras, Santo Domingo',
        latitude: 18.4800, longitude: -69.9200,
        startDatetime: new Date(lastWeek.setHours(8, 0, 0)),
        endDatetime:   new Date(lastWeek.setHours(14, 0, 0)),
        capacity: 60, registeredCount: 58, status: EventStatus.COMPLETED,
      },
    }),
  ]);
  console.log(`   ✅ ${events.length} eventos creados\n`);

  // ─── 11. APPOINTMENTS ─────────────────────────────────────────────────────
  console.log('🗓️ Creando citas...');
  await prisma.appointment.upsert({
    where: { id: 'appt-01' },
    update: {},
    create: {
      id: 'appt-01', donorId: 'donor-01', eventId: 'event-01',
      scheduledTime: new Date(tomorrow.setHours(9, 30, 0)),
      qrCode: 'QR-DEMO-MARIA-001', status: 'SCHEDULED',
    },
  });
  await prisma.appointment.upsert({
    where: { id: 'appt-02' },
    update: {},
    create: {
      id: 'appt-02', donorId: 'donor-05', eventId: 'event-01',
      scheduledTime: new Date(tomorrow.setHours(10, 0, 0)),
      qrCode: 'QR-DEMO-LUCIA-002', status: 'SCHEDULED',
    },
  });
  console.log('   ✅ 2 citas creadas\n');

  // ─── 12. POINT TRANSACTIONS ───────────────────────────────────────────────
  console.log('💰 Creando historial de puntos...');
  const ptxData = [
    { id: 'ptx-01', donorId: 'donor-01', type: 'DONATION',             points: 100,  balanceAfter: 100,  desc: 'Donación sangre entera' },
    { id: 'ptx-02', donorId: 'donor-01', type: 'DONATION',             points: 100,  balanceAfter: 200,  desc: 'Donación sangre entera' },
    { id: 'ptx-03', donorId: 'donor-01', type: 'FREQUENT_MILESTONE',   points: 200,  balanceAfter: 400,  desc: 'Bonus Donante Recurrente (3ra donación)' },
    { id: 'ptx-04', donorId: 'donor-01', type: 'REFERRAL',             points: 50,   balanceAfter: 450,  desc: 'Referido realizó su primera donación' },
    { id: 'ptx-05', donorId: 'donor-01', type: 'DONATION',             points: 100,  balanceAfter: 550,  desc: 'Donación sangre entera' },
    { id: 'ptx-06', donorId: 'donor-01', type: 'REDEMPTION',           points: -200, balanceAfter: 350,  desc: 'Canje en Farmacia Carol' },
    { id: 'ptx-07', donorId: 'donor-01', type: 'FREQUENT_MILESTONE',   points: 500,  balanceAfter: 850,  desc: 'Bonus Donante VIP' },
    { id: 'ptx-08', donorId: 'donor-05', type: 'DONATION',             points: 100,  balanceAfter: 100,  desc: 'Donación sangre entera' },
    { id: 'ptx-09', donorId: 'donor-05', type: 'DONATION',             points: 100,  balanceAfter: 200,  desc: 'Donación sangre entera' },
    { id: 'ptx-10', donorId: 'donor-05', type: 'FREQUENT_MILESTONE',   points: 200,  balanceAfter: 400,  desc: 'Bonus Donante Recurrente' },
    { id: 'ptx-11', donorId: 'donor-05', type: 'FREQUENT_MILESTONE',   points: 500,  balanceAfter: 900,  desc: 'Bonus Donante VIP' },
    { id: 'ptx-12', donorId: 'donor-05', type: 'DONATION',             points: 150,  balanceAfter: 1050, desc: 'Donación plaquetas' },
    { id: 'ptx-13', donorId: 'donor-05', type: 'REFERRAL',             points: 50,   balanceAfter: 1100, desc: 'Referido realizó su primera donación' },
    { id: 'ptx-14', donorId: 'donor-05', type: 'DONATION',             points: 100,  balanceAfter: 1200, desc: 'Donación sangre entera' },
  ];
  for (const p of ptxData) {
    const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 180));
    await prisma.pointTransaction.upsert({
      where: { id: p.id }, update: {},
      create: { id: p.id, donorId: p.donorId, type: p.type as any, points: p.points, balanceAfter: p.balanceAfter, description: p.desc, createdAt: d },
    });
  }
  console.log(`   ✅ ${ptxData.length} transacciones de puntos\n`);

  // ─── 13. FINANCIAL RECORDS ────────────────────────────────────────────────
  console.log('💵 Creando registros financieros...');
  const finData = [
    { id: 'fin-01', type: FinancialRecordType.COST,    cat: FinancialCategory.COLLECTION,  amount: 1200,  desc: 'Suministros recolección — Jornada mayo' },
    { id: 'fin-02', type: FinancialRecordType.COST,    cat: FinancialCategory.TESTING,     amount: 4500,  desc: 'Tests BioLab RD — 10 unidades' },
    { id: 'fin-03', type: FinancialRecordType.COST,    cat: FinancialCategory.STORAGE,     amount: 800,   desc: 'Mantenimiento refrigeración CD Principal' },
    { id: 'fin-04', type: FinancialRecordType.COST,    cat: FinancialCategory.LOGISTICS,   amount: 1500,  desc: 'Combustible y operación van refrigerada' },
    { id: 'fin-05', type: FinancialRecordType.REVENUE, cat: FinancialCategory.PARTNER_BILLING, amount: 12000, desc: 'Factura Hospital Darío Contreras — 5 unidades' },
    { id: 'fin-06', type: FinancialRecordType.REVENUE, cat: FinancialCategory.PARTNER_BILLING, amount: 8500,  desc: 'Factura Centro Médico Las Américas — 3 unidades' },
    { id: 'fin-07', type: FinancialRecordType.COST,    cat: FinancialCategory.REWARD_REDEMPTION, amount: 200, desc: 'Canje donante donor-01 en Farmacia Carol' },
    { id: 'fin-08', type: FinancialRecordType.REVENUE, cat: FinancialCategory.PARTNER_BILLING, amount: 5000, desc: 'Factura Clínica Corominas — 2 unidades plasma' },
  ];
  for (const f of finData) {
    const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 30));
    await prisma.financialRecord.upsert({
      where: { id: f.id }, update: {},
      create: { id: f.id, type: f.type, category: f.cat, amount: f.amount, currency: 'DOP', date: d, description: f.desc },
    });
  }
  console.log(`   ✅ ${finData.length} registros financieros\n`);

  // ─── 14. BADGES ───────────────────────────────────────────────────────────
  console.log('🏅 Creando badges...');
  const badges = await Promise.all([
    prisma.badge.upsert({ where: { id: 'badge-01' }, update: {}, create: { id: 'badge-01', name: 'Primera Donación', description: 'Realizaste tu primera donación de sangre', condition: { type: 'total_donations', value: 1 } } }),
    prisma.badge.upsert({ where: { id: 'badge-02' }, update: {}, create: { id: 'badge-02', name: 'Héroe Recurrente',  description: 'Donaste 3 o más veces en un año',          condition: { type: 'annual_donations', value: 3 } } }),
    prisma.badge.upsert({ where: { id: 'badge-03' }, update: {}, create: { id: 'badge-03', name: 'Donante VIP',       description: 'Donaste 6 o más veces en un año',          condition: { type: 'annual_donations', value: 6 } } }),
    prisma.badge.upsert({ where: { id: 'badge-04' }, update: {}, create: { id: 'badge-04', name: 'Embajador Sanguis', description: 'Referiste a 3 o más donantes',             condition: { type: 'referrals', value: 3 } } }),
    prisma.badge.upsert({ where: { id: 'badge-05' }, update: {}, create: { id: 'badge-05', name: 'Donante O-',        description: 'Eres donante universal (O negativo)',       condition: { type: 'blood_type', value: 'O_NEGATIVE' } } }),
  ]);
  // Assign badges to VIP donors
  for (const badgeId of ['badge-01', 'badge-02', 'badge-03']) {
    for (const donorId of ['donor-01', 'donor-05']) {
      const exists = await prisma.donorBadge.findUnique({ where: { donorId_badgeId: { donorId, badgeId } } });
      if (!exists) await prisma.donorBadge.create({ data: { donorId, badgeId } });
    }
  }
  await prisma.donorBadge.upsert({ where: { donorId_badgeId: { donorId: 'donor-05', badgeId: 'badge-05' } }, update: {}, create: { donorId: 'donor-05', badgeId: 'badge-05' } });
  console.log(`   ✅ ${badges.length} badges creados y asignados\n`);

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log('━'.repeat(55));
  console.log('✅ Seed completado exitosamente!\n');
  console.log('📋 CREDENCIALES DE ACCESO:');
  console.log('   🌐 Web Admin — http://localhost:3000/login');
  console.log('      Email:    admin@sanguis.do');
  console.log('      Password: Admin123!\n');
  console.log('   🌐 Swagger  — http://localhost:3001/api/docs\n');
  console.log('   📱 App Móvil — POST /auth/donor/login');
  console.log('      idNumber: 001-1234567-1  password: Donor123!  (María VIP O+)');
  console.log('      idNumber: 001-5678901-5  password: Donor123!  (Lucía VIP O-)');
  console.log('      idNumber: 001-2345678-2  password: Donor123!  (José Recurrente A+)\n');
  console.log('   💉 Unidades de sangre en inventario:');
  console.log('      STORED: bu-01 a bu-05');
  console.log('      TESTING (pendientes): bu-06, (test-09)');
  console.log('      QUARANTINE: bu-10');
  console.log('      USED: bu-08 | REJECTED: bu-09');
  console.log('━'.repeat(55));
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
