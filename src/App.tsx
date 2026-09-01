import { useState } from "react";
import { useStore } from "./store";
import ClientApp from "./ClientApp";
import AdminApp from "./AdminApp";

export default function App() {
  const [view, setView] = useState<"client" | "admin">("client");
  const store = useStore();

  return (
    <div className="h-full bg-bark-950 font-body text-bark-50 overflow-hidden">
      {view === "client" ? (
        <ClientApp store={store} onAdminAccess={() => setView("admin")} />
      ) : (
        <AdminApp store={store} onBack={() => setView("client")} />
      )}
    </div>
  );
}
