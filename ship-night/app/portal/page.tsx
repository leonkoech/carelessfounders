import AuthGate from "@/components/portal/AuthGate";
import Dashboard from "@/components/portal/Dashboard";

export default function PortalPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
