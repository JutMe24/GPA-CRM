import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { User, CabinetInfo } from '../types/crm';

interface LoginViewProps {
  users: User[];
  cabinetInfo?: CabinetInfo;
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, cabinetInfo, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!matchedUser) {
        setError('Aucun compte utilisateur trouvé avec cet e-mail.');
        setIsLoading(false);
        return;
      }

      if (matchedUser.status === 'INACTIF') {
        setError('Ce compte est désactivé. Veuillez contacter votre administrateur.');
        setIsLoading(false);
        return;
      }

      const expectedPassword = matchedUser.password || 'Horizon2026!';
      if (password !== expectedPassword) {
        setError('Mot de passe incorrect. Veuillez vérifier votre saisie.');
        setIsLoading(false);
        return;
      }

      // Success
      setIsLoading(false);
      onLogin(matchedUser);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        {/* Brand Logo & Title */}
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4 border border-indigo-400/30">
          <ShieldCheck className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {cabinetInfo?.nomCabinet || 'HORIZON ASSURANCES'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
          Plateforme sécurisée de Gestion de Portefeuille & Lead CRM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 font-semibold leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adresse E-mail Professionnelle
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@horizon-courtage.fr"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mot de passe
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">Protégé SSL 256-bit</span>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-indigo-600" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Se Connecter à l'Espace Courtier</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <p className="mt-6 text-center text-xs text-slate-400">
          ORIAS N° {cabinetInfo?.numeroOrias || '07001234'} • Conforme ACPR & RGPD Horizon Assurances
        </p>
      </div>
    </div>
  );
};
