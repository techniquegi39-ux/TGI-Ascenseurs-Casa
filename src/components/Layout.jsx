import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import { doc, onSnapshot } from 'firebase/firestore'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { db } from '../firebase.js'

const navigationSections = [
  {
    label: 'ESPACE DE TRAVAIL',
    items: [{ label: 'Tableau de bord', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'GESTION',
    items: [
      { label: 'Clients', to: '/clients', icon: Users },
      { label: 'Contrats', to: '/contracts', icon: FileText },
      { label: 'Parc d’Ascenseurs', to: '/elevators', icon: Building2 },
      { label: 'Interventions', to: '/interventions', icon: Wrench },
    ],
  },
  {
    label: 'COMMERCIAL',
    items: [
      { label: 'Devis', to: '/quotes', icon: FileText },
      { label: 'Factures', to: '/invoices', icon: Receipt },
      { label: 'Recouvrement', to: '/collections', icon: CreditCard },
    ],
  },
  {
    label: 'LOGISTIQUE',
    items: [
      { label: 'Bons de Commande', to: '/purchase-orders', icon: ShoppingCart },
      { label: 'Bons de Livraison', to: '/delivery-notes', icon: Truck },
      { label: 'Stock', to: '/inventory', icon: Package },
    ],
  },
  {
    label: 'PILOTAGE',
    items: [
      { label: 'Rapports', to: '/rapports', icon: BarChart3 },
      { label: 'Équipe', to: '/equipe', icon: ClipboardList },
    ],
  },
]

const pageTitles = Object.fromEntries(
  navigationSections.flatMap((section) =>
    section.items.map((item) => [item.to, item.label]),
  ),
)
pageTitles['/settings'] = 'Paramètres'
pageTitles['/parametres'] = 'Paramètres'

function getUserInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return 'U'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toLocaleUpperCase('fr-FR')
}

function Sidebar({ isOpen, onNavigate, companySettings }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform duration-200 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <img
            alt="TGI Ascenseurs"
            className="h-11 w-11 shrink-0 rounded-xl border border-white/15 bg-white p-0.5 object-contain shadow-lg shadow-blue-950/30 transition-transform duration-300 hover:scale-105"
            src={companySettings.companyLogoBase64 || '/logo.png.jpeg'}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-white">
              TGI Manager Pro
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.16em] text-slate-400">
              ASCENSEURS CASA
            </span>
          </span>
        </div>
        <button
          aria-label="Fermer le menu de navigation"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
          onClick={onNavigate}
          type="button"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Navigation principale" className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
        {navigationSections.map((section) => (
          <section key={section.label}>
            <h2 className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-500">
              {section.label}
            </h2>
            <ul className="space-y-1">
              {section.items.map(({ label, to, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    end={to === '/'}
                    onClick={onNavigate}
                    to={to}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/30'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <NavLink
          onClick={onNavigate}
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Settings aria-hidden="true" className="h-[18px] w-[18px]" />
          Paramètres
        </NavLink>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 text-xs text-slate-400">
          <CircleHelp aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Besoin d’assistance ?</span>
        </div>
      </div>
    </aside>
  )
}

function UserAvatar({ userData, currentUser, companySettings }) {
  const name = userData?.nom || currentUser?.displayName || currentUser?.email || 'Utilisateur'
  const role =
    typeof userData?.role === 'string'
      ? userData.role.trim().toLocaleLowerCase('fr-FR')
      : ''
  const photo =
    role === 'directeur'
      ? companySettings.directeurPhoto
      : role === 'commercial'
        ? companySettings.commercialPhoto
        : ''

  if (photo) {
    return (
      <img
        alt={`Photo du ${userData?.role || 'profil'}`}
        className="h-10 w-10 shrink-0 rounded-full border-2 border-blue-600 object-cover"
        src={photo}
      />
    )
  }

  return (
    <span
      aria-label={name}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-blue-100 bg-blue-50 text-sm font-bold text-blue-800"
    >
      {name && name !== 'Utilisateur' ? (
        getUserInitials(name)
      ) : (
        <UserRound aria-hidden="true" className="h-5 w-5" />
      )}
    </span>
  )
}

export default function Layout() {
  const { currentUser, userData, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [companySettings, setCompanySettings] = useState({})

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'company'),
      (settingsSnapshot) => {
        const settingsData = settingsSnapshot.exists() ? settingsSnapshot.data() : {}
        setCompanySettings({
          companyLogoBase64:
            typeof settingsData.companyLogoBase64 === 'string'
              ? settingsData.companyLogoBase64
              : '',
          directeurPhoto:
            typeof settingsData.directeurPhoto === 'string'
              ? settingsData.directeurPhoto
              : '',
          commercialPhoto:
            typeof settingsData.commercialPhoto === 'string'
              ? settingsData.commercialPhoto
              : '',
        })
      },
      (error) => {
        console.error(
          'Erreur lors du suivi des paramètres d’affichage de l’entreprise :',
          error,
        )
      },
    )

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

  async function handleLogout() {
    setLogoutError('')

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : 'La déconnexion a échoué. Réessayez.',
      )
    }
  }

  const pageTitle = pageTitles[location.pathname] || 'Espace de travail'
  const userName = userData?.nom || currentUser?.displayName || currentUser?.email || 'Utilisateur'

  return (
    <div className="min-h-screen bg-slate-50">
      {isMobileSidebarOpen && (
        <button
          aria-label="Fermer le menu de navigation"
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          type="button"
        />
      )}

      <Sidebar
        companySettings={companySettings}
        isOpen={isMobileSidebarOpen}
        onNavigate={() => setIsMobileSidebarOpen(false)}
      />

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_4px_16px_-12px_rgba(15,23,42,0.25)] backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Ouvrir le menu de navigation"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{pageTitle}</p>
              <p className="hidden text-xs text-slate-500 sm:block">
                TGI Ascenseurs Casa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              type="button"
            >
              <Bell aria-hidden="true" className="h-[18px] w-[18px]" />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/30 sm:gap-3 sm:pl-2"
                onClick={() => {
                  setLogoutError('')
                  setIsUserMenuOpen((isOpen) => !isOpen)
                }}
                type="button"
              >
                <UserAvatar
                  companySettings={companySettings}
                  currentUser={currentUser}
                  userData={userData}
                />
                <span className="hidden max-w-36 sm:block">
                  <span className="block truncate text-xs font-semibold text-slate-800">
                    {userName}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {userData?.role || 'Collaborateur'}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`hidden h-4 w-4 text-slate-400 transition sm:block ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
                  role="menu"
                >
                  <div className="border-b border-slate-100 px-4 pb-3 pt-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {currentUser?.email}
                    </p>
                  </div>
                  {logoutError && (
                    <p className="px-4 py-3 text-xs leading-5 text-red-700" role="alert">
                      {logoutError}
                    </p>
                  )}
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                    onClick={handleLogout}
                    role="menuitem"
                    type="button"
                  >
                    <LogOut aria-hidden="true" className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
