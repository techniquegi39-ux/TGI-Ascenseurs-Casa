function normalizeContractValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .trim()
}

export const COMMON_CONTRACT_CLAUSES = `CLAUSES COMMUNES OBLIGATOIRES

Accès et sécurité
Le Client garantit le libre accès à la machinerie, au local technique et aux équipements accessoires. Les clés et moyens d'accès nécessaires devront être disponibles chez le concierge ou auprès du syndic.

Exclusions de garantie et responsabilité
Les interventions liées au vandalisme, à une mauvaise utilisation, aux surtensions ou coupures électriques, aux infiltrations d'eau ou inondations, à la force majeure, ainsi qu'à toute intervention effectuée par un tiers non agréé par TGI Ascenseurs sont exclues du présent contrat.

Durée et tacite reconduction
Le contrat est conclu pour la durée indiquée dans les conditions particulières. À défaut de résiliation par lettre recommandée adressée à l'autre partie au moins trois mois avant l'expiration du terme, il est renouvelé automatiquement pour une durée équivalente.

Conditions de paiement et suspension
Toutes les prestations sont payables à réception ou aux échéances convenues. En cas d'impayé, TGI Ascenseurs pourra, après mise en demeure restée infructueuse, suspendre les prestations jusqu'au règlement intégral des sommes dues.

Litiges et juridiction
Tout litige relatif à l'exécution ou à l'interprétation du présent contrat relève exclusivement des juridictions compétentes du Tribunal de Commerce de Casablanca.`

const MAINTENANCE_SIMPLE_CLAUSES = `CONTRAT DE MAINTENANCE SIMPLE / PRÉVENTIVE

Article 1 - Objet et visites
TGI Ascenseurs assure l'entretien préventif normal de l'installation. À raison d'une visite mensuelle, ses techniciens procèdent notamment au graissage des organes mécaniques, au nettoyage de la fosse et de la machinerie, aux réglages nécessaires, ainsi qu'au contrôle des organes de sécurité conformément aux prescriptions applicables.

Article 2 - Dépannages et désincarcération
TGI Ascenseurs assure les dépannages illimités sur appel, avec la main-d'œuvre de dépannage incluse. Toute personne bloquée fait l'objet d'une désincarcération prioritaire, disponible vingt-quatre heures sur vingt-quatre et sept jours sur sept.

Article 3 - Pièces de rechange
Les petites fournitures courantes nécessaires à l'entretien, notamment les graisses, chiffons et fusibles usuels, sont incluses. Toute pièce de rechange majeure reste soumise à un devis préalable dont l'exécution est subordonnée à l'accord écrit du Client.

${COMMON_CONTRACT_CLAUSES}`

const MAINTENANCE_COMPLETE_CLAUSES = `CONTRAT DE MAINTENANCE COMPLÈTE / OMNIUM

Article 1 - Objet et visites
TGI Ascenseurs assure l'entretien préventif complet de l'installation. Une visite mensuelle comprend le graissage, le nettoyage de la fosse et de la machinerie, les réglages mécaniques et électriques, ainsi que le contrôle périodique des organes de sécurité.

Article 2 - Dépannages et désincarcération
Les dépannages sont assurés sur appel, vingt-quatre heures sur vingt-quatre et sept jours sur sept. La main-d'œuvre est incluse et la désincarcération des personnes bloquées bénéficie d'une priorité absolue.

Article 3 - Prise en charge des pièces
Le présent contrat prend en charge la fourniture et le remplacement des pièces d'usure normale, notamment les câbles de traction, galets, contacteurs, boutons d'appel, serrures des portes palières et autres composants usuels expressément inclus dans la maintenance complète.

${COMMON_CONTRACT_CLAUSES}`

const INSTALLATION_CLAUSES = `CONTRAT D'INSTALLATION NEUVE / MONTAGE

Article 1 - Fourniture et montage
TGI Ascenseurs assure la fourniture, la livraison, le montage, les essais, la mise en service et les réglages finaux de l'appareil conformément aux plans validés et aux normes de sécurité applicables, notamment la norme EN 81.

Article 2 - Obligations du Client
Le Client est tenu de mettre à disposition une gaine conforme, un local machinerie ventilé et éclairé, ainsi qu'une arrivée de courant triphasé correctement protégée. Ces travaux de génie civil et d'alimentation électrique restent à la charge du Client.

Article 3 - Délais et garantie
La durée des travaux est celle indiquée au planning contractuel. L'appareil bénéficie d'une garantie contractuelle de douze mois couvrant les pièces et la main-d'œuvre à compter du procès-verbal de réception signé par les parties.

Article 4 - Modalités de paiement
Les paiements suivent l'échéancier convenu : 40 % à la commande, 40 % à la livraison du matériel sur site et 20 % après mise en service. Toute retenue ou modification doit faire l'objet d'un accord écrit préalable.

${COMMON_CONTRACT_CLAUSES}`

const MODERNIZATION_CLAUSES = `CONTRAT DE MODERNISATION / TRAVAUX DE RÉNOVATION

Article 1 - Mise en conformité
TGI Ascenseurs réalise les travaux de modernisation décrits dans le devis annexé, comprenant les remplacements d'organes et les adaptations nécessaires à la mise en conformité sécuritaire de l'appareil.

Article 2 - Organes remplacés et garantie
Les organes spécifiques remplacés sont ceux identifiés au devis annexé. Les pièces remplacées bénéficient de la garantie contractuelle prévue dans ce devis, sauf exclusions expressément mentionnées.

Article 3 - Arrêt temporaire de l'appareil
Le Client autorise les arrêts temporaires strictement nécessaires à la réalisation des travaux. TGI Ascenseurs prend les mesures techniques appropriées pour réduire la durée d'immobilisation et sécurise les travaux conformément aux règles applicables.

${COMMON_CONTRACT_CLAUSES}`

export function getContractClausesTemplate(nature, serviceType = '') {
  const normalizedNature = normalizeContractValue(nature)
  const normalizedServiceType = normalizeContractValue(serviceType)

  if (normalizedNature.includes('installation') || normalizedNature.includes('montage')) {
    return INSTALLATION_CLAUSES
  }

  if (
    normalizedNature.includes('modern') ||
    normalizedNature.includes('renov') ||
    normalizedNature.includes('travaux')
  ) {
    return MODERNIZATION_CLAUSES
  }

  if (
    normalizedNature.includes('maintenance') ||
    normalizedNature.includes('entretien') ||
    normalizedNature.includes('prevent') ||
    normalizedNature.includes('omnium') ||
    normalizedNature.includes('toute')
  ) {
    if (
      normalizedServiceType.includes('omnium') ||
      normalizedServiceType.includes('tout') ||
      normalizedServiceType.includes('complete') ||
      normalizedServiceType.includes('p&mo') ||
      normalizedServiceType.includes('pieces')
    ) {
      return MAINTENANCE_COMPLETE_CLAUSES
    }
    return MAINTENANCE_SIMPLE_CLAUSES
  }

  return MAINTENANCE_SIMPLE_CLAUSES
}
