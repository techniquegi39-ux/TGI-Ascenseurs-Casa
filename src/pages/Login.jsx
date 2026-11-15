import { useState } from 'react'
import { ArrowRight, Building2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function getLoginErrorMessage(error) {
  if (error?.message === 'Compte désactivé' || error?.code === 'auth/user-disabled') {
    return 'Ce compte est désactivé. Contactez votre administrateur.'
  }

  if (error?.message === 'Profil utilisateur introuvable.') {
    return "Aucun profil ERP n'est associé à ce compte. Contactez votre administrateur."
  }

  if (
    ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(
      error?.code,
    )
  ) {
    return 'Adresse e-mail ou mot de passe incorrect.'
  }

  if (error?.code === 'auth/too-many-requests') {
    return 'Trop de tentatives. Veuillez patienter avant de réessayer.'
  }

  if (error?.code === 'auth/network-request-failed') {
    return 'Connexion impossible au serveur. Vérifiez votre connexion Internet.'
  }

  return 'La connexion a échoué. Vérifiez vos identifiants et réessayez.'
}

export default function Login() {
  const { currentUser, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (currentUser) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-blue-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div
          aria-hidden="true"
          className="absolute -right-36 -top-32 h-[34rem] w-[34rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-12 h-[25rem] w-[25rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-48 -left-28 h-[30rem] w-[30rem] rounded-full bg-blue-800/30 blur-3xl"
        />

        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-white/10">
            <Building2 aria-hidden="true" className="h-6 w-6 text-sky-300" />
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">TGI Manager Pro</span>
            <span className="block text-xs font-medium tracking-[0.18em] text-blue-200">
              ASCENSEURS CASA
            </span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl pb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-sky-200">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            GESTION INTÉGRÉE
          </div>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            La performance verticale, maîtrisée.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/75">
            Votre espace de pilotage pour les clients, les équipements et les opérations
            de TGI Ascenseurs Casa.
          </p>
        </div>

        <p className="relative z-10 text-xs text-blue-200/60">
          © {new Date().getFullYear()} TGI Ascenseurs Casa. Accès réservé au personnel autorisé.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-12 inline-flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-950 text-sky-300">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-bold tracking-tight text-slate-900">
                TGI Manager Pro
              </span>
              <span className="block text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                ASCENSEURS CASA
              </span>
            </span>
          </Link>

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
              Espace professionnel
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
              Bon retour parmi nous
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Connectez-vous avec vos identifiants TGI pour accéder à votre espace.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.22)] sm:p-8"
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="username"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    id="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nom@entreprise.ma"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoComplete="current-password"
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    id="password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Votre mot de passe"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <button
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
              {!isSubmitting && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />
              Connexion sécurisée par Firebase
            </div>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400 lg:hidden">
            Accès réservé au personnel autorisé de TGI Ascenseurs Casa.
          </p>
        </div>
      </section>
    </main>
  )
}
