"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Ban, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { api, errorMessage } from "@/lib/api-client";
import { PLANS } from "@/lib/constants";
import type { AdminUserRow } from "@/server/admin";
import {
  AdminPageHeader,
  AdminPagination,
  DataTable,
  DateCell,
  ErrorPanel,
  ListSkeleton,
  MobileCard,
  SearchForm,
  useAdminList,
} from "./shared";

function RoleBadges({ user }: { user: AdminUserRow }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {user.isAdmin ? (
        <Badge>
          <ShieldCheck /> Admin
        </Badge>
      ) : null}
      {user.isOwner ? <Badge variant="secondary">Owner</Badge> : <Badge variant="outline">Tenant</Badge>}
      {user.membership !== "FREE" ? <Badge variant="success">{PLANS[user.membership].name}</Badge> : null}
      {user.isBanned ? <Badge variant="destructive">Banned</Badge> : null}
      {!user.isVerified ? <Badge variant="muted">Email unverified</Badge> : null}
    </div>
  );
}

export function UsersPanel() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload, updateItem } = useAdminList<AdminUserRow>("/api/admin/users", {
    q: q || undefined,
    page,
  });
  const [confirming, setConfirming] = useState<AdminUserRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleBan(target: AdminUserRow) {
    setBusy(true);
    try {
      const updated = await api<AdminUserRow>(`/api/admin/users/${target.id}`, {
        method: "PATCH",
        body: { isBanned: !target.isBanned },
      });
      updateItem((u) => u.id === target.id, updated);
      toast.success(
        updated.isBanned
          ? `${target.username} is banned and signed out everywhere`
          : `${target.username} can use PGConnect again`
      );
      setConfirming(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const action = (u: AdminUserRow) =>
    u.isAdmin || u.id === me?.id ? (
      <span className="text-xs text-muted-foreground">—</span>
    ) : (
      <Button
        variant="outline"
        size="sm"
        className={u.isBanned ? undefined : "text-destructive hover:text-destructive"}
        onClick={() => setConfirming(u)}
      >
        {u.isBanned ? (
          <>
            <UserCheck /> Unban
          </>
        ) : (
          <>
            <Ban /> Ban
          </>
        )}
      </Button>
    );

  const items = data?.items ?? [];
  const banning = confirming ? !confirming.isBanned : false;

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Find accounts by username or email. Banning signs the user out and hides their listings."
        actions={
          <SearchForm
            initial={q}
            placeholder="Username or email"
            onSearch={(value) => {
              setQ(value);
              setPage(1);
            }}
          />
        }
      />

      {error ? (
        <ErrorPanel message={error} onRetry={reload} />
      ) : loading && !data ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description={q ? `Nothing matches “${q}”.` : undefined} />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <DataTable head={["User", "Roles", "Listings", "Joined", ""]}>
            {items.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{u.username}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <RoleBadges user={u} />
                </td>
                <td className="px-4 py-3 tabular-nums">{u.listingCount}</td>
                <td className="px-4 py-3">
                  <DateCell value={u.createdAt} />
                </td>
                <td className="px-4 py-3 text-right">{action(u)}</td>
              </tr>
            ))}
          </DataTable>

          <ul className="space-y-3 md:hidden">
            {items.map((u) => (
              <MobileCard key={u.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{u.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {action(u)}
                </div>
                <RoleBadges user={u} />
                <p className="text-xs text-muted-foreground">
                  {u.listingCount} listing{u.listingCount === 1 ? "" : "s"} · joined <DateCell value={u.createdAt} />
                </p>
              </MobileCard>
            ))}
          </ul>

          {data ? (
            <AdminPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banning ? "Ban" : "Unban"} {confirming?.username}?
            </DialogTitle>
            <DialogDescription>
              {banning
                ? "They will be signed out on every device and cannot log in. Their listings are hidden from search until you unban them."
                : "They will be able to log in again and their active listings will show up in search."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant={banning ? "destructive" : "default"}
              loading={busy}
              onClick={() => confirming && toggleBan(confirming)}
            >
              {banning ? "Ban user" : "Unban user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
