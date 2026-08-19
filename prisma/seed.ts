// prisma/seed.ts
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { encryptionService } from '../src/services/encryption.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const encryptedRefreshToken = encryptionService.encrypt('mock_google_refresh_token_xyz_123');

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo.contractor@receiptlens.local' },
    update: {},
    create: {
      email: 'demo.contractor@receiptlens.local',
      fullName: 'Alex Morgan (1099 Freelancer)',
      googleId: 'google_oauth_demo_1099',
      googleRefreshToken: encryptedRefreshToken,
      tier: SubscriptionTier.PRO_ANNUAL,
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Seeded demo user: ${demoUser.email} (ID: ${demoUser.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
