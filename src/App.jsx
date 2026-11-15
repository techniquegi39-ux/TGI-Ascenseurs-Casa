import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Clients from './pages/Clients.jsx'
import Collections from './pages/Collections.jsx'
import Contracts from './pages/Contracts.jsx'
import DeliveryNotes from './pages/DeliveryNotes.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Elevators from './pages/Elevators.jsx'
import Interventions from './pages/Interventions.jsx'
import Inventory from './pages/Inventory.jsx'
import Invoices from './pages/Invoices.jsx'
import PurchaseOrders from './pages/PurchaseOrders.jsx'
import Quotes from './pages/Quotes.jsx'
import Settings from './pages/Settings.jsx'

function ModulePlaceholder({ title }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        TGI Manager Pro
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Ce module est en cours de préparation.</p>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/elevators" element={<Elevators />} />
        <Route path="/ascenseurs" element={<Navigate to="/elevators" replace />} />
        <Route path="/interventions" element={<Interventions />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/delivery-notes" element={<DeliveryNotes />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/devis" element={<Navigate to="/quotes" replace />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/factures" element={<Navigate to="/invoices" replace />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/recouvrement" element={<Navigate to="/collections" replace />} />
        <Route path="/rapports" element={<ModulePlaceholder title="Rapports" />} />
        <Route path="/equipe" element={<ModulePlaceholder title="Équipe" />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/parametres" element={<Navigate to="/settings" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}