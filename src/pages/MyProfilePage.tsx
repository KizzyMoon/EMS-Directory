import { useAuth } from '../auth/AuthContext';
import { MemberProfilePage } from './MemberProfilePage';

export function MyProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <MemberProfilePage memberIdOverride={user.id} self />;
}
