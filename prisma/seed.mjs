import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const drivers = [
  { name: 'Arafat Karim', lat: 23.8103, lng: 90.4125, carModel: 'Toyota Axio', plate: 'DHA-1001' },
  { name: 'Naim Hasan', lat: 23.8041, lng: 90.4152, carModel: 'Honda Grace', plate: 'DHA-1002' },
  { name: 'Rahim Uddin', lat: 23.7925, lng: 90.4078, carModel: 'Nissan Sunny', plate: 'DHA-1003' },
  { name: 'Sabbir Alam', lat: 23.8700, lng: 90.3969, carModel: 'Toyota Premio', plate: 'DHA-1004' },
  { name: 'Fahim Islam', lat: 23.7465, lng: 90.3760, carModel: 'Suzuki Ciaz', plate: 'DHA-1005' },
  { name: 'Mizanur Rahman', lat: 23.7806, lng: 90.2794, carModel: 'Toyota Allion', plate: 'SAV-2001' },
  { name: 'Imran Hossain', lat: 22.3569, lng: 91.7832, carModel: 'Honda City', plate: 'CTG-3001' },
  { name: 'Shakib Ahmed', lat: 24.8949, lng: 91.8687, carModel: 'Toyota Fielder', plate: 'SYL-4001' },
  { name: 'Jamal Khan', lat: 24.3745, lng: 88.6042, carModel: 'Mitsubishi Lancer', plate: 'RAJ-5001' },
  { name: 'Anisur Rahman', lat: 25.7439, lng: 89.2752, carModel: 'Toyota Corolla', plate: 'RNG-6001' },
];

async function seedUsers() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin12345';
  const userPassword = process.env.DEFAULT_DRIVER_PASSWORD ?? 'User12345';
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUND ?? 10);

  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash(adminPassword, saltRounds),
    bcrypt.hash(userPassword, saltRounds),
  ]);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'System Admin',
      email: adminEmail,
      phone: '+8801700009999',
      password: adminHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'rider@example.com' },
    update: {},
    create: {
      name: 'Demo Rider',
      email: 'rider@example.com',
      phone: '+8801700001111',
      password: userHash,
      role: UserRole.USER,
    },
  });
}

async function seedDriversAndCars() {
  await prisma.car.deleteMany();
  await prisma.driver.deleteMany();

  for (const item of drivers) {
    await prisma.driver.create({
      data: {
        name: item.name,
        isAvailable: true,
        currentLat: item.lat,
        currentLng: item.lng,
        car: {
          create: {
            model: item.carModel,
            plateNumber: item.plate,
          },
        },
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedDriversAndCars();
  console.log('Seed completed: users, drivers, and cars inserted.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
