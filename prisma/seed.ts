import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the admin user."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`Seeded admin user: ${user.email}`);

  const DEFAULT_STAGES = [
    "New Lead",
    "Contacted",
    "Call Booked",
    "Call Completed",
    "Proposal Sent",
    "Won",
    "Lost",
  ];

  const stageCount = await prisma.stage.count();
  if (stageCount === 0) {
    await prisma.stage.createMany({
      data: DEFAULT_STAGES.map((name, position) => ({ name, position })),
    });
    console.log(`Seeded ${DEFAULT_STAGES.length} default pipeline stages`);
  } else {
    console.log(`Skipped stage seeding — ${stageCount} stage(s) already exist`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
