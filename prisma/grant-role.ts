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
 * Chạy: npm run role -- <email> <user|editor|admin|super_admin>
 * Ví dụ: npm run role -- trinhviethoangawm@gmail.com super_admin
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const [email, role] = process.argv.slice(2);
  const roles = Object.values(UserRole);
  if (!email || !roles.includes(role as UserRole)) {
    // Chỉ dẫn theo ĐÚNG cách người ta gọi tệp này (qua npm), không theo cách
    // node gọi nó. Thiếu `--` là npm ăn hết tham số và script nhận argv rỗng —
    // đọc thông báo cũ ("Dùng: grant-role.ts <email> ...") thì vẫn không biết
    // phải gõ gì cho đúng.
    console.error(`
  Thiếu tham số. Dùng:

    npm run role -- <email> <${roles.join(" | ")}>

  Ví dụ:

    npm run role -- ban@example.com super_admin

  Dấu -- là bắt buộc: không có nó thì npm giữ lại tham số cho chính nó.
`);
    process.exit(1);
  }
  const matches = await prisma.user.findMany({ where: { email: email.trim().toLowerCase() }, take: 2, select: { id: true } });
  if (matches.length !== 1) throw new Error('Email không xác định duy nhất một tài khoản. Dùng trang quản trị để chọn đúng ID tài khoản cần cấp quyền.');
  const user = await prisma.user.update({
    where: { id: matches[0].id },
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
