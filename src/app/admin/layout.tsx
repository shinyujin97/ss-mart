import { requireAdmin } from "@/lib/admin-auth";
import AdminSidebar from "./AdminSidebar";

export const metadata = { title: { template: "%s | SS Mart 관리자", default: "관리자 | SS Mart" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-[#f4f4f4]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
