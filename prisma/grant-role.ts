import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";

/**
 * Cấp quyền back office cho một tài khoản từ dòng lệnh.
 *
 * Đây là cách DUY NHẤT tạo ra super admin đầu tiên: không có endpoint HTTP nào
 * tự phong quyền, vì một endpoint như thế là cửa sau cho bất kỳ ai tìm ra nó.
 * Super admin thứ hai trở đi thì cấp trong back office.
 *
 * Chạy: npm run role -- trinhviethoangawm@gmail.com super_admin
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const [email, role] = process.argv.slice(2);
  const roles = Object.values(UserRole);
  if (!email || !roles.includes(role as UserRole)) {
    throw new Error(`Dùng: grant-role.ts <email> <${roles.join("|")}>`);
  }
  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { role: role as UserRole },
  });
  await prisma.auditLog.create({
    data: {
      actorEmail: "cli",
      action: "role_change",
      entity: "user",
      entityId: user.id,
      entityLabel: user.email,
      after: { role },
    },
  });
  console.log(`${user.email} → ${user.role}`);
}

main().finally(() => void prisma.$disconnect());
