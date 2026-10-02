import type { Metadata } from "next";

import { ProfileSettings } from "@/components/profile/profile-settings";
import { PageHeader } from "@/components/shared/page-header";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getAvatarSignedUrl } from "@/lib/profile/queries";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const user = await requireAuthenticatedUser();
  const avatarUrl = await getAvatarSignedUrl(user.profile.avatar_url);

  return (
    <div>
      <PageHeader
        title="Mi perfil"
        description="Administra tu información personal, foto de perfil y seguridad de acceso."
      />
      <ProfileSettings
        user={{
          fullName: user.profile.full_name,
          email: user.email,
          role: user.profile.role,
          isActive: user.profile.is_active,
          avatarUrl,
        }}
      />
    </div>
  );
}
