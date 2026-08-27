import { AdminSidebar } from "./AdminSidebar";

/**
 * The chrome every admin screen sits in: the rail, then a scrolling content
 * column. Desktop is 1440x900 and tablet 1024x768 with the rail collapsed -
 * there is no mobile frame anywhere in the admin set.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-nevo-cream">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
