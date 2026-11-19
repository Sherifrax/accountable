import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { PageHeader } from "./components/PageHeader";
import { ContactPage } from "./features/contacts/ContactPage";
import { ContactsPage } from "./features/contacts/ContactsPage";
import { DealPage } from "./features/deals/DealPage";
import { DealsPage } from "./features/deals/DealsPage";
import { OrganizationPage } from "./features/organizations/OrganizationPage";
import { OrganizationsPage } from "./features/organizations/OrganizationsPage";
import { PipelinePage } from "./features/pipeline/PipelinePage";

function Soon({ title }: { title: string }) {
  return <PageHeader title={title} />;
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Soon title="Dashboard" />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="deals/:id" element={<DealPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="organizations/:id" element={<OrganizationPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="contacts/:id" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
