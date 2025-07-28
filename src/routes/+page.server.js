import { redirect } from '@sveltejs/kit';

export function load() {
  // 303 — 用于表单操作，在成功提交后
  // 307 — 用于临时重定向
  // 308 — 用于永久重定向
  redirect(307, '/login');
}
