/**
 * School Admin Layer context layout (Product Arch A.1 — desktop-first,
 * permission-scoped, multiple admins with different roles in one dashboard).
 *
 * Will host, along the way:
 * - Layout-level auth check backing up proxy.ts (any admin scope — FE Arch §2;
 *   individual pages check specific scopes via usePermissions)
 * - PermissionContext provider — Admin Layer only (FE Arch §8)
 * - Dynamic navigation per scopes held (D.3)
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-nevo-cream text-nevo-near-black">
      {children}
    </div>
  );
}
