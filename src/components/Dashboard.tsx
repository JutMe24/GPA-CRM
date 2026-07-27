import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Car, 
  Home, 
  Briefcase, 
  TrendingUp, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Euro, 
  Plus, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CalendarDays,
  ShieldCheck,
  UserCheck,
  Building2,
  Filter
} from 'lucide-react';
import { Lead, LeadStatus, LeadType, User } from '../types/crm';

interface DashboardProps {
  leads: Lead[];
  currentUser?: User;
  users?: User[];
  onOpenNewLeadModal: () => void;
  onSelectLead: (lead: Lead) => void;
  onNavigateToLeads: (filterType?: LeadType | 'ALL') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  currentUser,
  users = [],
  onOpenNewLeadModal,
  onSelectLead,
  onNavigateToLeads
}) => {
  // Scope logic based on User Role and Team Attachment
  const userRole = currentUser?.role || 'ADMIN';
  const userTeam = currentUser?.equipe || '';
  const userId = currentUser?.id;
  const userName = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : '';

  const isGlobalAdmin = userRole === 'ADMIN' || userRole === 'DIRECTEUR_PRODUCTION';
  const isTeamScope = userRole === 'RESPONSABLE_EQUIPE' || userRole === 'MANAGER' || userRole === 'GESTIONNAIRE';
  const isAgentScope = userRole === 'AGENT_COMMERCIAL' || userRole === 'COURTIER';

  // Admin / Director manual filters for drilling down
  const [adminTeamFilter, setAdminTeamFilter] = useState<string>('ALL');
  const [adminUserFilter, setAdminUserFilter] = useState<string>('ALL');

  // Filter state for conversion rate and portfolio metrics
  const [conversionFilter, setConversionFilter] = useState<'ALL' | 'AUTO' | 'HABITATION' | 'VTC'>('ALL');
  const [portfolioFilter, setPortfolioFilter] = useState<'ALL' | 'AUTO' | 'HABITATION' | 'VTC'>('ALL');

  // Calculate Effective Leads according to role
  const effectiveLeads = useMemo(() => {
    // 1. Directeur Commercial et Admin : vue globale de l'ensemble de la production
    if (isGlobalAdmin) {
      let list = leads;
      if (adminTeamFilter !== 'ALL') {
        list = list.filter(l => (l.equipe || '').toLowerCase() === adminTeamFilter.toLowerCase());
      }
      if (adminUserFilter !== 'ALL') {
        list = list.filter(l => l.assignedToId === adminUserFilter);
      }
      return list;
    }

    // 2. Responsable d'équipe & Gestionnaire : vue générale de l'équipe à laquelle il est rattaché
    if (isTeamScope) {
      if (!userTeam) return leads;
      return leads.filter(l => {
        if (l.equipe && l.equipe.toLowerCase() === userTeam.toLowerCase()) return true;
        if (l.assignedToId) {
          const assignedUser = users.find(u => u.id === l.assignedToId);
          if (assignedUser && assignedUser.equipe && assignedUser.equipe.toLowerCase() === userTeam.toLowerCase()) {
            return true;
          }
        }
        return false;
      });
    }

    // 3. Commercial (Agent commercial / courtier) : uniquement ses propres résultats
    if (isAgentScope) {
      if (!userId) return leads;
      return leads.filter(l => 
        l.assignedToId === userId || 
        (l.assignedToName && l.assignedToName.toLowerCase() === userName.toLowerCase())
      );
    }

    return leads;
  }, [leads, currentUser, users, adminTeamFilter, adminUserFilter, isGlobalAdmin, isTeamScope, isAgentScope, userTeam, userId, userName]);

  // Stats calculations based on effective leads
  const totalLeads = effectiveLeads.length;
  const autoLeads = effectiveLeads.filter(l => l.type === 'AUTO');
  const habitationLeads = effectiveLeads.filter(l => l.type === 'HABITATION');
  const vtcLeads = effectiveLeads.filter(l => l.type === 'VTC');

  const filteredPortfolioLeads = portfolioFilter === 'ALL'
    ? effectiveLeads
    : effectiveLeads.filter(l => l.type === portfolioFilter);
  const filteredTotalLeadsCount = filteredPortfolioLeads.length;

  const gagneLeads = effectiveLeads.filter(l => l.status === 'GAGNE');

  // Helper to extract frais dossier for a lead
  const getLeadFraisDossier = (lead: Lead): number => {
    if (lead.type === 'AUTO') return lead.autoDetails?.fraisDossier || 0;
    if (lead.type === 'HABITATION') return lead.habitationDetails?.fraisDossier || 0;
    if (lead.type === 'VTC') return lead.vtcDetails?.fraisDossier || 0;
    return 0;
  };

  // Total fees collected on WON leads
  const totalFraisGagne = effectiveLeads
    .filter(l => l.status === 'GAGNE')
    .reduce((acc, lead) => acc + getLeadFraisDossier(lead), 0);

  // Total expected fees across all effective leads
  const totalFraisPrevu = effectiveLeads
    .reduce((acc, lead) => acc + getLeadFraisDossier(lead), 0);

  // Filtered conversion rate calculation
  const conversionLeads = conversionFilter === 'ALL'
    ? effectiveLeads
    : effectiveLeads.filter(l => l.type === conversionFilter);

  const conversionGagne = conversionLeads.filter(l => l.status === 'GAGNE').length;
  const conversionTotal = conversionLeads.length;
  const filteredConversionRate = conversionTotal > 0
    ? Math.round((conversionGagne / conversionTotal) * 100)
    : 0;

  // Upcoming callbacks
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingActions = effectiveLeads.filter(l => l.prochaineActionDate && l.status !== 'GAGNE' && l.status !== 'PERDU');
  const actionsToday = pendingActions.filter(l => l.prochaineActionDate === todayStr);

  // Status breakdown
  const countByStatus: Record<LeadStatus, number> = {
    NOUVEAU: effectiveLeads.filter(l => l.status === 'NOUVEAU').length,
    A_CONTACTER: effectiveLeads.filter(l => l.status === 'A_CONTACTER').length,
    DEVIS_ENVOYE: effectiveLeads.filter(l => l.status === 'DEVIS_ENVOYE').length,
    RELANCE: effectiveLeads.filter(l => l.status === 'RELANCE').length,
    GAGNE: effectiveLeads.filter(l => l.status === 'GAGNE').length,
    PERDU: effectiveLeads.filter(l => l.status === 'PERDU').length,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tableau de Bord Courtage CRM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Gestion & Qualification Auto, Habitation et VTC
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Pilotez l'ensemble de vos demandes d'assurances, établissez des devis sur-mesure et organisez vos relances clients avec précision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewLeadModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Lead Auto / Hab / VTC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scope Context Banner */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md ${
            isGlobalAdmin ? 'bg-indigo-600' : isTeamScope ? 'bg-blue-600' : 'bg-emerald-600'
          }`}>
            {isGlobalAdmin ? <Building2 className="w-5 h-5" /> : isTeamScope ? <Users className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900">
                {isGlobalAdmin && 'Périmètre Global : Direction & Ensemble de la Production'}
                {isTeamScope && `Périmètre Équipe : ${userTeam || 'Équipe de rattachement'}`}
                {isAgentScope && `Périmètre Commercial : Vos résultats personnels (${currentUser?.prenom} ${currentUser?.nom})`}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                {userRole === 'AGENT_COMMERCIAL' ? 'Agent Commercial' : userRole === 'RESPONSABLE_EQUIPE' ? 'Responsable d\'équipe' : userRole === 'DIRECTEUR_PRODUCTION' ? 'Directeur Production' : userRole}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isGlobalAdmin && `Affichage consolidé de la production globale du cabinet (${effectiveLeads.length} dossiers au total).`}
              {isTeamScope && `Résultats généraux consolidés de votre équipe ${userTeam ? `"${userTeam}"` : ''} (${effectiveLeads.length} dossiers au total).`}
              {isAgentScope && `Affichage strictement restreint à vos affaires personnelles (${effectiveLeads.length} dossiers).`}
            </p>
          </div>
        </div>

        {/* Global Admin Filter Tools */}
        {isGlobalAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filtrer la vue :</span>
            </div>
            <select
              value={adminTeamFilter}
              onChange={(e) => setAdminTeamFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="ALL">🏢 Toutes les équipes</option>
              {Array.from(new Set(leads.map(l => l.equipe).filter(Boolean))).map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>

            <select
              value={adminUserFilter}
              onChange={(e) => setAdminUserFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="ALL">👤 Tous les commerciaux</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.equipe || 'Équipe non spécifiée'})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Leads Portefeuille avec Filtre Produit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leads Portefeuille</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Product Filter Pills */}
            <div className="mt-2.5 flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600">
              <button
                onClick={(e) => { e.stopPropagation(); setPortfolioFilter('ALL'); }}
                className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                  portfolioFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                Tous
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPortfolioFilter('AUTO'); }}
                className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                  portfolioFilter === 'AUTO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                Auto
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPortfolioFilter('HABITATION'); }}
                className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                  portfolioFilter === 'HABITATION'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                Habitation
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPortfolioFilter('VTC'); }}
                className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                  portfolioFilter === 'VTC'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                VTC
              </button>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{filteredTotalLeadsCount}</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {portfolioFilter === 'ALL' ? 'Total' : portfolioFilter}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToLeads(portfolioFilter)}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-3 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir les prospects ({portfolioFilter === 'ALL' ? 'tous' : portfolioFilter.toLowerCase()})</span>
            <ArrowRight className="w-3 h-3 text-blue-500" />
          </button>
        </div>

        {/* Card 2: Montant des Frais de Dossier Encaissés */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Frais de Dossier Encaissés</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Euro className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{totalFraisGagne.toLocaleString('fr-FR')} €</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {gagneLeads.length} Gagné{gagneLeads.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Frais perçus sur dossiers gagnés (Prévus : {totalFraisPrevu.toLocaleString('fr-FR')} €)
          </p>
        </div>

        {/* Card 3: Taux de Transformation avec Filtre Produit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taux de Conversion</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Product Filter Pills */}
          <div className="mt-2.5 flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-600">
            <button
              onClick={() => setConversionFilter('ALL')}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                conversionFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setConversionFilter('AUTO')}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                conversionFilter === 'AUTO'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setConversionFilter('HABITATION')}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                conversionFilter === 'HABITATION'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              Habitation
            </button>
            <button
              onClick={() => setConversionFilter('VTC')}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                conversionFilter === 'VTC'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              VTC
            </button>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{filteredConversionRate}%</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {conversionGagne} / {conversionTotal} Souscrit{conversionGagne > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Rapport souscriptions / total dossiers {conversionFilter === 'ALL' ? 'tous produits' : conversionFilter.toLowerCase()}
          </p>
        </div>

        {/* Card 4: Action / Calls Due */}
        <div 
          onClick={() => onNavigateToLeads()}
          className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/30 to-white shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Relances du jour</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-900">{actionsToday.length}</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {pendingActions.length} au total
            </span>
          </div>
          <p className="text-xs text-amber-700 mt-2 font-medium">
            Planifiées pour aujourd'hui
          </p>
        </div>
      </div>

      {/* Product Categories Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Auto Card */}
        <div 
          onClick={() => onNavigateToLeads('AUTO')}
          className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md hover:shadow-xl transition cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl group-hover:scale-125 transition"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                <Car className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="text-lg font-bold">Assurance Auto</h3>
            </div>
            <span className="text-2xl font-extrabold text-blue-200">{autoLeads.length}</span>
          </div>
          <p className="text-xs text-blue-200/80 mb-4">
            Conducteurs, véhicules, antécédents, sinistres & relevés d'information
          </p>
          <div className="flex items-center justify-between text-xs font-medium border-t border-white/10 pt-3">
            <span className="text-blue-300">Voir les dossiers Auto</span>
            <ArrowRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Habitation Card */}
        <div 
          onClick={() => onNavigateToLeads('HABITATION')}
          className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-md hover:shadow-xl transition cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl group-hover:scale-125 transition"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                <Home className="w-6 h-6 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold">Habitation MRH</h3>
            </div>
            <span className="text-2xl font-extrabold text-emerald-200">{habitationLeads.length}</span>
          </div>
          <p className="text-xs text-emerald-200/80 mb-4">
            Maisons, appartements, propriétaires, locataires & PNO
          </p>
          <div className="flex items-center justify-between text-xs font-medium border-t border-white/10 pt-3">
            <span className="text-emerald-300">Voir les dossiers Habitation</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* VTC Card */}
        <div 
          onClick={() => onNavigateToLeads('VTC')}
          className="bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-2xl p-6 shadow-md hover:shadow-xl transition cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                <Briefcase className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold">VTC & RC Pro</h3>
            </div>
            <span className="text-2xl font-extrabold text-amber-300">{vtcLeads.length}</span>
          </div>
          <p className="text-xs text-amber-200/80 mb-4">
            Chauffeurs professionnels, carte VTC, flotte & responsabilité civile
          </p>
          <div className="flex items-center justify-between text-xs font-medium border-t border-white/10 pt-3">
            <span className="text-amber-400">Voir les dossiers VTC</span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Progress & Upcoming Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Pipeline Funnel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pipeline de Qualification</h3>
              <p className="text-xs text-slate-500">Répartition des leads selon leur avancement dans le cycle de vente</p>
            </div>
            <button
              onClick={() => onNavigateToLeads()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Vue Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Nouveau */}
            <div>
              <div className="flex justify-between text-sm mb-1.5 font-medium">
                <span className="text-blue-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Nouveau Lead
                </span>
                <span className="text-slate-600 font-bold">{countByStatus.NOUVEAU} ({totalLeads > 0 ? Math.round((countByStatus.NOUVEAU/totalLeads)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (countByStatus.NOUVEAU/totalLeads)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* A Contacter */}
            <div>
              <div className="flex justify-between text-sm mb-1.5 font-medium">
                <span className="text-amber-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  À contacter / En cours
                </span>
                <span className="text-slate-600 font-bold">{countByStatus.A_CONTACTER} ({totalLeads > 0 ? Math.round((countByStatus.A_CONTACTER/totalLeads)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (countByStatus.A_CONTACTER/totalLeads)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Devis Envoyé */}
            <div>
              <div className="flex justify-between text-sm mb-1.5 font-medium">
                <span className="text-purple-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  Devis Envoyé
                </span>
                <span className="text-slate-600 font-bold">{countByStatus.DEVIS_ENVOYE} ({totalLeads > 0 ? Math.round((countByStatus.DEVIS_ENVOYE/totalLeads)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (countByStatus.DEVIS_ENVOYE/totalLeads)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Relance */}
            <div>
              <div className="flex justify-between text-sm mb-1.5 font-medium">
                <span className="text-orange-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  Relance à faire
                </span>
                <span className="text-slate-600 font-bold">{countByStatus.RELANCE} ({totalLeads > 0 ? Math.round((countByStatus.RELANCE/totalLeads)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (countByStatus.RELANCE/totalLeads)*100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Gagné */}
            <div>
              <div className="flex justify-between text-sm mb-1.5 font-medium">
                <span className="text-emerald-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Souscrit / Gagné
                </span>
                <span className="text-slate-600 font-bold">{countByStatus.GAGNE} ({totalLeads > 0 ? Math.round((countByStatus.GAGNE/totalLeads)*100) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${totalLeads > 0 ? (countByStatus.GAGNE/totalLeads)*100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Recent Leads Table */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Derniers Leads Enregistrés</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold uppercase">
                    <th className="pb-2">Lead / Réf</th>
                    <th className="pb-2">Produit</th>
                    <th className="pb-2">Téléphone</th>
                    <th className="pb-2">Statut</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {effectiveLeads.slice(0, 4).map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-2.5 font-medium text-slate-900">
                        <div>{lead.prenom} {lead.nom}</div>
                        <div className="text-[10px] text-slate-400">{lead.referenceDevis}</div>
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          lead.type === 'AUTO' ? 'bg-blue-100 text-blue-800' :
                          lead.type === 'HABITATION' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {lead.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600 font-mono text-[11px]">{lead.telephone}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-medium text-blue-600 hover:underline">
                        Ouvrir
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Callback & Action Reminders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Relances & RAPPELS</h3>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingActions.length} à faire
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Prochaines actions de relance qualifiées avec heure programmée
            </p>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {pendingActions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Aucune relance programmée.
                </div>
              ) : (
                pendingActions.map((lead) => (
                  <div 
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50/20 transition cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {lead.prenom} {lead.nom}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        lead.type === 'AUTO' ? 'bg-blue-100 text-blue-700' :
                        lead.type === 'HABITATION' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {lead.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium line-clamp-2">
                      📌 {lead.prochaineActionIntitule || 'Rappeler le client'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 font-mono text-amber-700 font-semibold">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {lead.prochaineActionDate} {lead.prochaineActionHeure && `à ${lead.prochaineActionHeure}`}
                      </span>
                      <span className="text-blue-600 font-medium hover:underline">
                        📞 {lead.telephone}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Astuce Courtier</h4>
            <p className="text-xs text-slate-300">
              Chaque relance effectuée à l'heure exacte augmente le taux de transformation de 35%. N'oubliez pas d'actualiser les notes de vos leads !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
