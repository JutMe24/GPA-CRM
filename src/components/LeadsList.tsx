import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  LayoutList, 
  Kanban, 
  Car, 
  Home, 
  Briefcase, 
  Clock, 
  PhoneCall, 
  ChevronRight, 
  MoreVertical,
  SlidersHorizontal,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { Lead, LeadQualification, LeadStatus, LeadType, User } from '../types/crm';
import { exportLeadsToExcel } from '../utils/excel';

interface LeadsListProps {
  leads: Lead[];
  onOpenNewLeadModal: () => void;
  onOpenImportModal: () => void;
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onUpdateLead?: (lead: Lead) => void;
  initialProductFilter?: LeadType | 'ALL';
  currentUser?: User;
}

const getFractionnementSuffix = (fractionnement?: string) => {
  switch (fractionnement) {
    case 'Mensuel':
      return '/ mois';
    case 'Trimestriel':
      return '/ trimestre';
    case 'Semestriel':
      return '/ semestre';
    case 'Annuel':
      return '/ an';
    default:
      return '/ mois';
  }
};

export const LeadsList: React.FC<LeadsListProps> = ({
  leads,
  onOpenNewLeadModal,
  onOpenImportModal,
  onSelectLead,
  onUpdateStatus,
  onUpdateLead,
  initialProductFilter = 'ALL',
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<LeadType | 'ALL'>(initialProductFilter);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filtered Leads based on filters & user permissions
  const filteredLeads = leads.filter((lead) => {
    // Check view all permission / Team / Agent restriction
    if (currentUser && !currentUser.permissions.canViewAllLeads) {
      const attrib = (lead.attribueA || '').toLowerCase();
      const leadEquipe = (lead.equipe || '').toLowerCase();
      const userEquipe = (currentUser.equipe || '').toLowerCase();
      const matchesUser = attrib.includes(currentUser.nom.toLowerCase()) || attrib.includes(currentUser.prenom.toLowerCase());

      if (currentUser.role === 'AGENT_COMMERCIAL' || currentUser.role === 'COURTIER') {
        // Agent commercial sees ONLY leads directly assigned to them
        if (!matchesUser) return false;
      } else if (currentUser.role === 'RESPONSABLE_EQUIPE' || currentUser.role === 'GESTIONNAIRE' || currentUser.role === 'MANAGER') {
        // Responsable équipe & Gestionnaire see leads of their assigned team OR assigned to them
        const matchesTeam = Boolean(userEquipe && leadEquipe && leadEquipe === userEquipe);
        if (!matchesTeam && !matchesUser) return false;
      } else {
        // General fallback
        if (!matchesUser) return false;
      }
    }

    // Product match
    if (productFilter !== 'ALL' && lead.type !== productFilter) return false;

    // Status match
    if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;

    // Search term match
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = `${lead.prenom} ${lead.nom}`.toLowerCase().includes(term);
      const phoneMatch = lead.telephone.includes(term);
      const emailMatch = lead.email.toLowerCase().includes(term);
      const refMatch = lead.referenceDevis.toLowerCase().includes(term);
      const cityMatch = lead.ville.toLowerCase().includes(term);

      let immatMatch = false;
      if (lead.type === 'AUTO' && lead.autoDetails) {
        immatMatch = lead.autoDetails.immatriculation.toLowerCase().includes(term);
      } else if (lead.type === 'VTC' && lead.vtcDetails) {
        immatMatch = lead.vtcDetails.immatriculation.toLowerCase().includes(term);
      }

      return nameMatch || phoneMatch || emailMatch || refMatch || cityMatch || immatMatch;
    }

    return true;
  });

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'NOUVEAU':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'A_CONTACTER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DEVIS_ENVOYE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RELANCE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'GAGNE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PERDU':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: LeadStatus) => {
    switch (status) {
      case 'NOUVEAU': return 'Nouveau Lead';
      case 'A_CONTACTER': return 'À Contacter';
      case 'DEVIS_ENVOYE': return 'Devis Envoyé';
      case 'RELANCE': return 'Relance à faire';
      case 'GAGNE': return 'Souscrit / Gagné';
      case 'PERDU': return 'Perdu / Rejeté';
      default: return status;
    }
  };

  const kanbanColumns: LeadStatus[] = [
    'NOUVEAU',
    'A_CONTACTER',
    'DEVIS_ENVOYE',
    'RELANCE',
    'GAGNE',
    'PERDU'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, téléphone, immatriculation, ville, réf..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Action Buttons & View Switcher */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center space-x-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vue Tableau"
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline">Tableau</span>
              </button>

              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vue Pipeline Kanban"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>

            {/* Export Excel */}
            {(!currentUser || currentUser.permissions.canExportData) && (
              <button
                onClick={() => exportLeadsToExcel(filteredLeads)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                title="Exporter les leads filtrés en Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export XLSX</span>
              </button>
            )}

            {/* Import Excel - Seuls ADMIN et DIRECTEUR_PRODUCTION ont le droit d'importer */}
            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'DIRECTEUR_PRODUCTION') && (
              <button
                onClick={onOpenImportModal}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer"
                title="Importer des leads via fichier Excel ou CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}

            {/* New Lead */}
            {(!currentUser || currentUser.permissions.canCreateLeads) && (
              <button
                onClick={onOpenNewLeadModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Lead</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Product Type Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Branche :</span>
            {(['ALL', 'AUTO', 'HABITATION', 'VTC'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setProductFilter(type)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  productFilter === type
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {type === 'AUTO' && <Car className="w-3.5 h-3.5 text-blue-400" />}
                {type === 'HABITATION' && <Home className="w-3.5 h-3.5 text-emerald-400" />}
                {type === 'VTC' && <Briefcase className="w-3.5 h-3.5 text-amber-400" />}
                <span>{type === 'ALL' ? 'Tous les produits' : type}</span>
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs font-bold bg-slate-100 text-slate-800 p-1.5 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="NOUVEAU">Nouveau Lead</option>
              <option value="A_CONTACTER">À Contacter</option>
              <option value="DEVIS_ENVOYE">Devis Envoyé</option>
              <option value="RELANCE">Relance à faire</option>
              <option value="GAGNE">Gagné / Souscrit</option>
              <option value="PERDU">Perdu</option>
            </select>
          </div>
        </div>
      </div>

      {/* RESULT COUNTER */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>Affichage de <strong>{filteredLeads.length}</strong> dossier(s) sur {leads.length} au total</span>
      </div>

      {/* VIEW MODE 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Réf & Prospect</th>
                  <th className="p-4">Branche Produit</th>
                  <th className="p-4">Coordonnées</th>
                  <th className="p-4">Cotisation Prévue</th>
                  <th className="p-4">Statut & Qualif</th>
                  <th className="p-4">Prochaine Action</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      Aucun lead d'assurance ne correspond à vos critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, idx) => {
                    let cotis = 0;
                    let fractionnement = 'Mensuel';
                    let formula = 'Formule non définie';
                    let immatOrDetail = '';

                    if (lead.type === 'AUTO' && lead.autoDetails) {
                      cotis = lead.autoDetails.cotisationMontant;
                      fractionnement = lead.autoDetails.fractionnement || 'Mensuel';
                      formula = lead.autoDetails.formuleSouhaitee;
                      immatOrDetail = lead.autoDetails.immatriculation;
                    } else if (lead.type === 'HABITATION' && lead.habitationDetails) {
                      cotis = lead.habitationDetails.cotisationMontant;
                      fractionnement = lead.habitationDetails.fractionnement || 'Mensuel';
                      formula = lead.habitationDetails.formuleSouhaitee;
                      immatOrDetail = `${lead.habitationDetails.surfaceM2}m² - ${lead.habitationDetails.typeLogement}`;
                    } else if (lead.type === 'VTC' && lead.vtcDetails) {
                      cotis = lead.vtcDetails.cotisationMontant;
                      fractionnement = lead.vtcDetails.fractionnement || 'Mensuel';
                      formula = lead.vtcDetails.formuleSouhaitee;
                      immatOrDetail = lead.vtcDetails.immatriculation;
                    }

                    return (
                      <tr 
                        key={`lead-row-${lead.id}-${idx}`}
                        onClick={() => onSelectLead(lead)}
                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {lead.prenom} {lead.nom}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              {lead.referenceDevis}
                            </span>
                            {(lead.attribueA || lead.assignedBroker) && (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200/60">
                                👤 {lead.attribueA || lead.assignedBroker}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center space-x-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              lead.type === 'AUTO' ? 'bg-blue-100 text-blue-800' :
                              lead.type === 'HABITATION' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {lead.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">{immatOrDetail}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-mono font-semibold text-slate-800 text-[11px]">
                            {lead.telephone}
                          </div>
                          <div className="text-[10px] text-slate-500">{lead.email}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-emerald-800 text-xs">
                            {cotis > 0 ? `${cotis.toLocaleString('fr-FR')} € ${getFractionnementSuffix(fractionnement)}` : '-'}
                          </div>
                          <div className="text-[10px] text-slate-400">{formula}</div>
                        </td>

                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1.5 items-start">
                            {/* Direct Status Selector */}
                            <select
                              value={lead.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as LeadStatus;
                                if (onUpdateLead) {
                                  onUpdateLead({
                                    ...lead,
                                    status: newStatus,
                                    updatedAt: new Date().toISOString()
                                  });
                                } else {
                                  onUpdateStatus(lead.id, newStatus);
                                }
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer outline-none transition shadow-2xs ${getStatusBadgeClass(lead.status)}`}
                            >
                              <option value="NOUVEAU">Nouveau Lead</option>
                              <option value="A_CONTACTER">À Contacter</option>
                              <option value="DEVIS_ENVOYE">Devis Envoyé</option>
                              <option value="RELANCE">Relance à faire</option>
                              <option value="GAGNE">Souscrit / Gagné</option>
                              <option value="PERDU">Perdu / Rejeté</option>
                            </select>

                            {/* Direct Qualification Selector */}
                            <select
                              value={lead.qualification || 'CHAUD'}
                              onChange={(e) => {
                                const newQualif = e.target.value as LeadQualification;
                                if (onUpdateLead) {
                                  onUpdateLead({
                                    ...lead,
                                    qualification: newQualif,
                                    updatedAt: new Date().toISOString()
                                  });
                                }
                              }}
                              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer outline-none transition"
                            >
                              <option value="CHAUD">🔥 Chaud</option>
                              <option value="TIEDE">⚡ Tiède</option>
                              <option value="FROID">❄️ Froid</option>
                              <option value="HORS_CIBLE">🚫 Hors Cible</option>
                              <option value="INJOIGNABLE">📞 Injoignable</option>
                            </select>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-slate-800 text-xs line-clamp-1">
                            {lead.prochaineActionIntitule || '-'}
                          </div>
                          {lead.prochaineActionDate && (
                            <div className="text-[10px] font-mono text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {lead.prochaineActionDate} {lead.prochaineActionHeure && `a ${lead.prochaineActionHeure}`}
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLead(lead);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {kanbanColumns.map((colStatus) => {
            const colLeads = filteredLeads.filter((l) => l.status === colStatus);

            return (
              <div 
                key={colStatus} 
                className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col min-w-[220px] space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    {getStatusLabel(colStatus)}
                  </span>
                  <span className="bg-white text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    {colLeads.length}
                  </span>
                </div>

                {/* Column Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {colLeads.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-slate-400 italic">
                      Aucun lead
                    </div>
                  ) : (
                    colLeads.map((lead, idx) => {
                      let cotis = 0;
                      let fractionnement = 'Mensuel';
                      if (lead.type === 'AUTO' && lead.autoDetails) {
                        cotis = lead.autoDetails.cotisationMontant;
                        fractionnement = lead.autoDetails.fractionnement || 'Mensuel';
                      } else if (lead.type === 'HABITATION' && lead.habitationDetails) {
                        cotis = lead.habitationDetails.cotisationMontant;
                        fractionnement = lead.habitationDetails.fractionnement || 'Mensuel';
                      } else if (lead.type === 'VTC' && lead.vtcDetails) {
                        cotis = lead.vtcDetails.cotisationMontant;
                        fractionnement = lead.vtcDetails.fractionnement || 'Mensuel';
                      }

                      return (
                        <div
                          key={`lead-kanban-${lead.id}-${idx}`}
                          onClick={() => onSelectLead(lead)}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              lead.type === 'AUTO' ? 'bg-blue-100 text-blue-800' :
                              lead.type === 'HABITATION' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {lead.type}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{lead.referenceDevis}</span>
                          </div>

                          <div>
                            <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
                              <span>{lead.prenom} {lead.nom}</span>
                              {(lead.attribueA || lead.assignedBroker) && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200/60">
                                  👤 {lead.attribueA || lead.assignedBroker}
                                </span>
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">{lead.telephone}</p>
                          </div>

                          {cotis > 0 && (
                            <div className="text-xs font-bold text-emerald-700 pt-1 border-t border-slate-100 flex items-center justify-between">
                              <span>{cotis.toLocaleString('fr-FR')} € {getFractionnementSuffix(fractionnement)}</span>
                            </div>
                          )}

                          {/* Quick Qualification & Status change in Kanban */}
                          <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as LeadStatus;
                                if (onUpdateLead) {
                                  onUpdateLead({ ...lead, status: newStatus, updatedAt: new Date().toISOString() });
                                } else {
                                  onUpdateStatus(lead.id, newStatus);
                                }
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer outline-none ${getStatusBadgeClass(lead.status)}`}
                            >
                              <option value="NOUVEAU">Nouveau</option>
                              <option value="A_CONTACTER">À Contacter</option>
                              <option value="DEVIS_ENVOYE">Devis Envoyé</option>
                              <option value="RELANCE">Relance</option>
                              <option value="GAGNE">Gagné</option>
                              <option value="PERDU">Perdu</option>
                            </select>

                            <select
                              value={lead.qualification || 'CHAUD'}
                              onChange={(e) => {
                                const newQualif = e.target.value as LeadQualification;
                                if (onUpdateLead) {
                                  onUpdateLead({ ...lead, qualification: newQualif, updatedAt: new Date().toISOString() });
                                }
                              }}
                              className="text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer outline-none"
                            >
                              <option value="CHAUD">🔥 Chaud</option>
                              <option value="TIEDE">⚡ Tiède</option>
                              <option value="FROID">❄️ Froid</option>
                              <option value="HORS_CIBLE">🚫 Hors Cible</option>
                              <option value="INJOIGNABLE">📞 Injoignable</option>
                            </select>
                          </div>

                          {lead.prochaineActionIntitule && (
                            <div className="text-[10px] text-slate-600 bg-amber-50 p-1.5 rounded border border-amber-200">
                              <p className="font-medium line-clamp-1">📌 {lead.prochaineActionIntitule}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
