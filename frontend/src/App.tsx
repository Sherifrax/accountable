import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PageHeader } from "./components/PageHeader";

function Soon({ title }: { title: string }) {
  return <PageHeader title={title} />;
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Soon title="Dashboard" />} />
        <Route path="pipeline" element={<Soon title="Pipeline" />} />
        <Route path="deals" element={<Soon title="Deals" />} />
        <Route path="deals/:id" element={<Soon title="Deal" />} />
        <Route path="organizations" element={<Soon title="Organizations" />} />
        <Route path="organizations/:id" element={<Soon title="Organization" />} />
        <Route path="contacts" element={<Soon title="Contacts" />} />
        <Route path="contacts/:id" element={<Soon title="Contact" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
