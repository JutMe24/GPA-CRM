import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  Building2,
  DollarSign,
  Award,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Lead, InsurancePartnerApiConfig, PartnerTarifResult } from '../types/crm';

interface PartnerMultiTarificateurProps {
  lead: Lead;
  partners: InsurancePartnerApiConfig[];
  onApplyQuoteToLead?: (result: PartnerTarifResult) => void;
}

export const PartnerMultiTarificateur: React.FC<PartnerMultiTarificateurProps> = ({
  lead,
  partners,
  onApplyQuoteToLead
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');
  const [results, setResults] = useState<PartnerTarifResult[] | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePartnersCount = partners.filter((p) => p.status === 'CONNECTE' && p.autoQuotingEnabled).length;

  const handleRunTarification = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResults(null);
    setAppliedNotice(null);

    // Multi-partner quote calculation steps
    const steps = [
      'Analyse du profil du souscripteur et des antécédents...',
      'Interrogation simultanée des Web Services Partenaires (Allianz, April, Maxance, NetVox, Generali)...',
      'Calcul des primes, franchises et commissions courtiers...',
      'Optimisation des offres selon le score de souscription...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepText(steps[i]);
      await new Promise((r) => setTimeout(r, 350));
    }

    try {
      const response = await fetch('/api/partner-tarificateur/calculate-quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, partners })
      });

      const data = await response.json();

      if (data.success && data.results) {
        setResults(data.results);
        if (data.results.length > 0) {
          setSelectedPartnerId(data.results[0].partnerId);
        }
      } else {
        setErrorMsg(data.error || 'Erreur lors du calcul des tarifs partenaires.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de contacter les API des tarificateurs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAndApply = (result: PartnerTarifResult) => {
    setSelectedPartnerId(result.partnerId);
    if (onApplyQuoteToLead) {
      onApplyQuoteToLead(result);
      setAppliedNotice(`Offre ${result.partnerName} (${result.cotisationMensuelle}€/mois) appliquée au devis !`);
      setTimeout(() => setAppliedNotice(null), 4000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden space-y-0">
      {/* Widget Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Zap className="w-5 h-5 text-indigo-400" />
            </span>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Tarificateur Web Services Multi-Compagnies API
              </h3>
              <p className="text-xs text-slate-300">
                Interrogation directe des moteurs de calcul d'assurance en 1-clic ({activePartnersCount} partenaires actifs).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunTarification}
          disabled={loading || activePartnersCount === 0}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
              <span>Calcul en cours...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Lancer la Tarification API</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Progress Bar */}
      {loading && (
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-3 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 mb-1 animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <p className="font-bold text-xs text-slate-900">{currentStepText}</p>
          <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-indigo-600 h-2 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Applied Success Toast */}
      {appliedNotice && (
        <div className="p-3 bg-emerald-500 text-white text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{appliedNotice}</span>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Initial State when no quotes run yet */}
      {!loading && !results && !errorMsg && (
        <div className="p-6 text-center text-slate-500 space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <p className="font-bold text-slate-800 text-xs">
              Tarifiez auprès des compagnies et grossistes partenaires
            </p>
            <p className="text-[11px] text-slate-500">
              Cliquez sur <strong>"Lancer la Tarification API"</strong> pour transmettre le dossier ({lead.type}) en temps réel à Allianz, April, Maxance, NetVox et Generali.
            </p>
          </div>
        </div>
      )}

      {/* Results Comparison Grid */}
      {!loading && results && results.length > 0 && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Résultats Comparatifs Web Services ({results.length} Offres Obtenues)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Lead : <strong className="text-slate-800">{lead.nom} {lead.prenom}</strong> ({lead.type})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item, idx) => {
              const isSelected = selectedPartnerId === item.partnerId;
              const isTopMatch = idx === 0;

              return (
                <div
                  key={item.partnerId}
                  className={`rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between relative space-y-3 ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Badge for best match */}
                  {isTopMatch && (
                    <span className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wide">
                      <Sparkles className="w-3 h-3" /> Meilleur Match ({item.matchScore}%)
                    </span>
                  )}

                  <div className="space-y-3 pt-1">
                    {/* Partner Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.partnerLogo}
                          alt={item.partnerName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{item.partnerName}</h5>
                          <span className="text-[10px] text-slate-500 font-medium">{item.formuleName}</span>
                        </div>
                      </div>

                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {item.category}
                      </span>
                    </div>

                    {/* Pricing Core */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">Cotisation Mensuelle</span>
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-indigo-700">{item.cotisationMensuelle} €</span>
                          <span className="text-[10px] text-slate-400 font-normal"> /mois</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                        <span className="text-slate-500">Cotisation Annuelle :</span>
                        <span className="font-bold text-slate-800">{item.cotisationAnnuelle} € /an</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Franchise :</span>
                        <span className="font-semibold text-slate-700">{item.franchise} €</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-100">
                        <span className="font-medium flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Com. Courtier ({item.commissionTaux}%):
                        </span>
                        <span className="font-extrabold">{item.commissionMontantEstime} €</span>
                      </div>
                    </div>

                    {/* Key points */}
                    <div className="space-y-1 text-[11px]">
                      <p className="font-bold text-slate-700 text-[10px] uppercase">Garanties incluses :</p>
                      <ul className="space-y-0.5">
                        {item.garantiesIncluses.slice(0, 3).map((g, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => handleSelectAndApply(item)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isSelected
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>{isSelected ? 'Offre Rétenue' : 'Choisir cette Offre pour Devis'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
