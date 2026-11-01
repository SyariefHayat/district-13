import * as React from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { UserHeader } from "../components/UserHeader";
import { UserStatsCards } from "../components/UserStatsCards";
import { UserTable } from "../components/UserTable";
import { UserFormDialog } from "../components/UserFormDialog";
import { UserPasswordDialog } from "../components/UserPasswordDialog";
import { useUserData } from "../hooks/useUserData";
import type { UserItem } from "../data/userData";

export default function UserPage() {
  const {
    users,
    currentUser,
    isLoading,
    error,
    refetch,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    deleteMultiple,
  } = useUserData();

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserItem | null>(null);

  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [passwordTargetUser, setPasswordTargetUser] =
    React.useState<UserItem | null>(null);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormDialogOpen(true);
  };

  const handleOpenChangePassword = (user: UserItem) => {
    setPasswordTargetUser(user);
    setPasswordDialogOpen(true);
  };

  const handleExport = (selectedUsers?: UserItem[]) => {
    const listToExport =
      selectedUsers && selectedUsers.length > 0 ? selectedUsers : users;

    if (!listToExport.length) {
      toast.add({ title: "Tidak ada data pengguna untuk diekspor" });
      return;
    }

    const exportData = listToExport.map((u) => ({
      ID: u.id,
      Username: u.username,
      Peran: u.role,
      Status: u.isActive ? "Active" : "Inactive",
      "Tanggal Dibuat": u.createdAt,
      "Terakhir Diperbarui": u.updatedAt,
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: `Berhasil mengekspor ${listToExport.length} pengguna`,
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <UserHeader onExport={() => handleExport()} onAddUser={handleOpenAdd} />

      {error && (
        <div className="mx-4 md:mx-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="size-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="gap-1.5"
          >
            <IconRefresh className="size-4" />
            <span>Coba lagi</span>
          </Button>
        </div>
      )}

      <UserStatsCards users={users} isLoading={isLoading} />

      <UserTable
        users={users}
        isLoading={isLoading}
        currentUserId={currentUser?.username}
        onToggleStatus={toggleUserStatus}
        onEditUser={handleOpenEdit}
        onChangePassword={handleOpenChangePassword}
        onDeleteUser={deleteUser}
        onDeleteMultiple={deleteMultiple}
        onExport={handleExport}
      />

      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={editingUser}
        onSubmit={async (values) => {
          if (editingUser) {
            return await updateUser(editingUser.id, values);
          } else {
            return await createUser({
              username: values.username,
              password: values.password!,
              role: values.role,
            });
          }
        }}
      />

      <UserPasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        user={passwordTargetUser}
        onSubmit={async (userId, newPassword) => {
          return await updateUser(userId, { password: newPassword });
        }}
      />
    </div>
  );
}
