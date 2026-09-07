import { UserRole } from '@prisma/client';

/**
 * Bậc quyền. So sánh bằng SỐ chứ không liệt kê từng vai trong mỗi guard: thêm
 * một vai mới ở giữa mà phải đi sửa hai chục chỗ `@Roles(...)` thì kiểu gì cũng
 * sót một chỗ, và chỗ sót đó là một lỗ hổng chứ không phải một lỗi hiển thị.
 */
export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.user]: 0,
  [UserRole.editor]: 1,
  [UserRole.admin]: 2,
  [UserRole.super_admin]: 3,
};

export function hasAtLeast(role: UserRole, minimum: UserRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Người dùng đã xác thực, gắn vào request bởi [AuthGuard]. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/** Request đã qua [AuthGuard]. */
export type AuthedRequest = { user?: AuthUser };
