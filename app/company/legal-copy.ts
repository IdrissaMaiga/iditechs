import { company } from "@/lib/company";
import type { Lang } from "./copy";

export type LegalKind = "privacy" | "terms";
type Section = { h: string; p?: string[]; ul?: string[] };
export type LegalDoc = { title: string; description: string; updated: string; intro: string; sections: Section[] };

const UPDATED = { fr: "Dernière mise à jour : 29 octobre 2026", en: "Last updated: 29 October 2026" };
const WHO_FR = `IDITECHS, entreprise individuelle de ${company.owner}, immatriculée au Registre du Commerce de Bamako sous le numéro ${company.rccm}, ${company.address}.`;
const WHO_EN = `IDITECHS, the sole proprietorship of ${company.owner}, registered with the Bamako Trade Register under number ${company.rccm}, ${company.address}.`;
const CONTACT_FR = `Contact : ${company.email}, ${company.phones[0]} (WhatsApp).`;
const CONTACT_EN = `Contact: ${company.email}, ${company.phones[0]} (WhatsApp).`;

const privacyFr: LegalDoc = {
  title: "Politique de confidentialité",
  description: "Quelles données IDITECHS collecte auprès de ses clients et visiteurs, pourquoi, combien de temps, avec quels prestataires, et comment exercer vos droits.",
  updated: UPDATED.fr,
  intro: "Nous collectons le minimum de données nécessaire pour répondre à vos demandes, réaliser nos prestations et tenir notre comptabilité. Nous ne vendons jamais vos données et n'utilisons aucun outil publicitaire.",
  sections: [
    { h: "1. Responsable du traitement", p: [WHO_FR, CONTACT_FR] },
    {
      h: "2. Données collectées",
      ul: [
        "Contact et projet : nom, entreprise, téléphone, e-mail, adresse (pour les documents), description de votre besoin et messages échangés par WhatsApp, e-mail ou formulaire.",
        "Documents commerciaux : devis, contrats, factures et reçus, avec vos identifiants professionnels (RCCM, NIF) si vous êtes une entreprise ou une organisation.",
        "Paiements : référence de transaction Orange Money ou reçu pour les espèces. Pour les paiements par carte, Stripe traite le paiement : nous ne voyons ni ne conservons jamais votre numéro de carte, seulement le montant, le statut et les quatre derniers chiffres.",
        "Visite du site : page consultée, page de provenance, identifiant de session aléatoire, adresse IP et horodatage, collectés par notre propre outil de statistiques, sans cookie publicitaire ni outil tiers.",
        "Contenus confiés pour la prestation : textes, images, accès et données nécessaires à la réalisation du projet.",
      ],
    },
    {
      h: "3. Finalités et bases légales",
      ul: [
        "Répondre à vos demandes et établir un devis (mesures précontractuelles).",
        "Exécuter le contrat : réaliser, livrer, former, facturer et assurer la garantie et la maintenance.",
        "Respecter nos obligations légales et comptables (conservation des factures et reçus).",
        "Mesurer la fréquentation et améliorer le site (intérêt légitime).",
        "Vous informer de nos services si vous êtes déjà client ou prospect (intérêt légitime ; vous pouvez vous y opposer à tout moment).",
      ],
    },
    {
      h: "4. Destinataires et prestataires",
      p: ["Vos données sont traitées par le fondateur et, pour la signature, l'installation ou la formation à Bamako, par un mandataire désigné. Nous faisons appel à des prestataires techniques qui n'agissent que pour notre compte :"],
      ul: [
        "Stripe (paiements par carte et factures en ligne) ;",
        "Orange Money (Orange Mali) pour les paiements mobiles ;",
        "WhatsApp (Meta Platforms) pour la messagerie ;",
        "Hostinger pour la location des serveurs qui hébergent notre site, nos applications et notre messagerie, administrés par IDITECHS.",
      ],
    },
    {
      h: "5. Durées de conservation",
      ul: [
        "Devis, factures, reçus et pièces comptables : 10 ans (obligations comptables OHADA).",
        "Données de prospects sans suite : 3 ans après le dernier échange.",
        "Contenus de projet : restitués ou supprimés à la fin du projet, sauf maintenance en cours (sauvegardes) ou demande contraire de votre part.",
        "Statistiques de visite : les adresses IP ne servent pas à vous identifier ; les données sont agrégées à des fins statistiques.",
      ],
    },
    {
      h: "6. Sécurité",
      p: ["Connexions chiffrées (HTTPS), accès limité au fondateur, serveurs et messagerie administrés par IDITECHS, authentification forte sur les services tiers. Nous ne demandons jamais vos mots de passe personnels : les accès nécessaires au projet sont créés pour IDITECHS puis révoqués à la fin."],
    },
    {
      h: "7. Vos droits",
      p: [
        `Vous pouvez demander l'accès, la rectification, l'effacement, la limitation ou la portabilité de vos données, et vous opposer à un traitement, en écrivant à ${company.email}. Nous répondons sous 30 jours.`,
        "Ces droits s'exercent dans le cadre de la loi malienne n° 2013-015 du 21 mai 2013 portant protection des données à caractère personnel (Autorité de Protection des Données à caractère Personnel). Si vous résidez dans l'Union européenne, le RGPD s'applique également et vous pouvez saisir votre autorité de contrôle.",
      ],
    },
    {
      h: "8. Cookies",
      p: ["Le site public n'utilise aucun cookie de suivi. Un identifiant de session aléatoire est conservé dans le stockage de session de votre navigateur pour les statistiques et disparaît à sa fermeture. L'espace privé de l'administrateur utilise un cookie de connexion strictement nécessaire."],
    },
    { h: "9. Modifications", p: ["Toute mise à jour de cette politique est publiée sur cette page avec sa date."] },
  ],
};

const privacyEn: LegalDoc = {
  title: "Privacy policy",
  description: "What data IDITECHS collects from clients and visitors, why, for how long, with which providers, and how to exercise your rights.",
  updated: UPDATED.en,
  intro: "We collect the minimum data needed to answer your requests, deliver our services and keep our books. We never sell your data and use no advertising tools.",
  sections: [
    { h: "1. Data controller", p: [WHO_EN, CONTACT_EN] },
    {
      h: "2. Data we collect",
      ul: [
        "Contact and project: name, company, phone, e-mail, address (for documents), a description of your need and the messages exchanged by WhatsApp, e-mail or contact form.",
        "Business documents: quotes, contracts, invoices and receipts, including your business identifiers (trade register, tax number) if you are a company or an organisation.",
        "Payments: Orange Money transaction reference or a receipt for cash. For card payments, Stripe processes the payment: we never see or store your card number, only the amount, the status and the last four digits.",
        "Site visits: page viewed, referring page, a random session identifier, IP address and timestamp, collected by our own statistics tool, with no advertising cookies and no third-party tool.",
        "Content entrusted for the work: texts, images, access and data needed to deliver the project.",
      ],
    },
    {
      h: "3. Purposes and legal bases",
      ul: [
        "Answering your requests and preparing a quote (pre-contractual steps).",
        "Performing the contract: building, delivering, training, invoicing, warranty and maintenance.",
        "Meeting our legal and accounting obligations (keeping invoices and receipts).",
        "Measuring traffic and improving the site (legitimate interest).",
        "Telling you about our services if you are already a client or prospect (legitimate interest; you can object at any time).",
      ],
    },
    {
      h: "4. Recipients and providers",
      p: ["Your data is handled by the founder and, for signing, installation or training in Bamako, by an appointed representative. We rely on technical providers acting only on our behalf:"],
      ul: [
        "Stripe (card payments and online invoices);",
        "Orange Money (Orange Mali) for mobile payments;",
        "WhatsApp (Meta Platforms) for messaging;",
        "Hostinger for the rented servers that host our website, applications and e-mail, administered by IDITECHS.",
      ],
    },
    {
      h: "5. Retention",
      ul: [
        "Quotes, invoices, receipts and accounting records: 10 years (OHADA accounting obligations).",
        "Prospects who did not become clients: 3 years after the last exchange.",
        "Project content: returned or deleted at the end of the project, unless maintenance is ongoing (backups) or you ask otherwise.",
        "Visit statistics: IP addresses are not used to identify you; data is aggregated for statistics.",
      ],
    },
    {
      h: "6. Security",
      p: ["Encrypted connections (HTTPS), access limited to the founder, servers and e-mail administered by IDITECHS, strong authentication on third-party services. We never ask for your personal passwords: the access needed for a project is created for IDITECHS and revoked when it ends."],
    },
    {
      h: "7. Your rights",
      p: [
        `You may request access to, rectification, erasure, restriction or portability of your data, and object to processing, by writing to ${company.email}. We reply within 30 days.`,
        "These rights apply under Malian Law No. 2013-015 of 21 May 2013 on the protection of personal data (Autorité de Protection des Données à caractère Personnel). If you live in the European Union, the GDPR also applies and you may complain to your supervisory authority.",
      ],
    },
    {
      h: "8. Cookies",
      p: ["The public site uses no tracking cookies. A random session identifier is kept in your browser's session storage for statistics and disappears when you close it. The administrator's private area uses a strictly necessary login cookie."],
    },
    { h: "9. Changes", p: ["Any update to this policy is published on this page with its date."] },
  ],
};

const termsFr: LegalDoc = {
  title: "Conditions générales de prestation",
  description: "Devis, acompte, délais, livraison, garantie 30 jours, propriété intellectuelle, annulation et remboursement : les règles qui encadrent toute prestation IDITECHS.",
  updated: UPDATED.fr,
  intro: "Ces conditions s'appliquent à toute prestation d'IDITECHS : sites web et boutiques en ligne, logiciels métier, installation et réseau, formation et maintenance. Le devis accepté et l'acompte versé valent acceptation des présentes.",
  sections: [
    { h: "1. Prestataire", p: [WHO_FR, CONTACT_FR] },
    {
      h: "2. Devis et commande",
      p: [
        "Chaque prestation commence par un devis écrit gratuit, valable 30 jours, qui précise le périmètre, les livrables, le délai, le prix et le nombre de révisions incluses.",
        "La commande est ferme à réception de votre accord écrit (« bon pour accord » par e-mail ou WhatsApp, ou devis signé) et de l'acompte. Toute demande hors périmètre fait l'objet d'un devis complémentaire.",
      ],
    },
    {
      h: "3. Prix et paiement",
      ul: [
        "Les prix sont exprimés en FCFA, ou dans la devise indiquée sur le devis, et sont nets.",
        "Acompte de 50 % à la commande (70 à 100 % pour le matériel et les licences avancés par IDITECHS ; formation réglée avant la séance). Solde à la livraison, avant la mise en ligne ou la remise finale.",
        "Moyens de paiement : Orange Money, espèces contre reçu, carte bancaire via Stripe. Un reçu numéroté est remis pour chaque paiement.",
        "Les factures sont payables sous 7 jours. En cas de retard, après rappel resté sans effet, des intérêts au taux légal en vigueur au Mali sont dus et la prestation peut être suspendue.",
      ],
    },
    {
      h: "4. Délais",
      p: ["Les délais courent à compter de la réception de l'acompte et de tous les éléments à fournir par le client (contenus, accès, validations). Ils sont prolongés d'autant en cas de retard du client ou de demande de modification du périmètre."],
    },
    {
      h: "5. Obligations du client",
      p: ["Le client fournit dans les délais convenus des contenus, accès et informations exacts et licites, désigne un interlocuteur et valide chaque étape. Il garantit détenir les droits sur les textes, images, marques et données qu'il confie à IDITECHS."],
    },
    {
      h: "6. Livraison, recette et révisions",
      p: ["La livraison est validée par écrit (e-mail, WhatsApp ou procès-verbal de réception). Sans remarque dans les 7 jours suivant la livraison, le livrable est réputé accepté. Les révisions sont réalisées dans la limite prévue au devis ; au-delà, elles sont facturées."],
    },
    {
      h: "7. Garantie et maintenance",
      p: [
        "IDITECHS corrige gratuitement pendant 30 jours après la livraison les défauts de conformité par rapport au devis.",
        "Au-delà, les évolutions et la maintenance font l'objet d'un abonnement mensuel ou d'un devis. Sont exclus : les modifications effectuées par le client ou un tiers, les pannes de services externes (hébergeur, Meta/WhatsApp, Orange, Google) et le matériel non fourni par IDITECHS.",
      ],
    },
    {
      h: "8. Hébergement, noms de domaine et services tiers",
      p: ["Hébergement, noms de domaine et comptes tiers sont souscrits au nom du client chaque fois que possible ; leurs frais récurrents restent à sa charge. IDITECHS n'est pas responsable des indisponibilités, changements de conditions ou tarifs de ces prestataires."],
    },
    {
      h: "9. Propriété intellectuelle",
      p: [
        "Après paiement intégral, le client devient propriétaire des livrables spécifiques créés pour lui (design, contenus, code spécifique). IDITECHS conserve la propriété de ses outils, composants génériques et savoir-faire, qu'il reste libre de réutiliser.",
        "Sauf refus écrit du client, IDITECHS peut citer le projet comme référence (nom, logo, captures d'écran).",
      ],
    },
    {
      h: "10. Annulation et remboursement",
      ul: [
        "Annulation par le client avant tout début des travaux : l'acompte est remboursé intégralement.",
        "Annulation après le démarrage : l'acompte reste acquis à IDITECHS à hauteur du travail réalisé et des frais engagés ; l'éventuel surplus est remboursé.",
        "Arrêt de la prestation par IDITECHS sans faute du client : remboursement des sommes correspondant aux prestations non réalisées.",
        "Les remboursements sont effectués par le moyen de paiement d'origine ; pour les paiements par carte, via Stripe, sous 10 jours ouvrés.",
      ],
    },
    {
      h: "11. Responsabilité",
      p: ["IDITECHS est tenu à une obligation de moyens. Sa responsabilité est limitée au montant payé pour la prestation concernée et ne couvre pas les pertes indirectes (chiffre d'affaires, image, données non sauvegardées par le client)."],
    },
    { h: "12. Données personnelles", p: ["Le traitement des données est décrit dans notre politique de confidentialité."] },
    {
      h: "13. Droit applicable et litiges",
      p: ["Les présentes sont soumises au droit malien. En cas de désaccord, les parties recherchent d'abord une solution amiable ; à défaut, le Tribunal de Commerce de Bamako est compétent. Les clients consommateurs résidant à l'étranger conservent le bénéfice des dispositions impératives de leur pays."],
    },
  ],
};

const termsEn: LegalDoc = {
  title: "Terms of service",
  description: "Quote, deposit, timelines, delivery, 30-day warranty, intellectual property, cancellation and refunds: the rules that govern every IDITECHS engagement.",
  updated: UPDATED.en,
  intro: "These terms apply to every IDITECHS service: websites and online shops, business software, IT setup and networks, training and maintenance. An accepted quote and the paid deposit constitute acceptance of these terms.",
  sections: [
    { h: "1. Provider", p: [WHO_EN, CONTACT_EN] },
    {
      h: "2. Quote and order",
      p: [
        "Every engagement starts with a free written quote, valid 30 days, stating the scope, deliverables, timeline, price and number of included revisions.",
        "The order is firm once we receive your written approval (by e-mail or WhatsApp, or a signed quote) and the deposit. Any request outside the scope is quoted separately.",
      ],
    },
    {
      h: "3. Prices and payment",
      ul: [
        "Prices are stated in FCFA, or in the currency shown on the quote, and are net.",
        "A 50% deposit is due on order (70 to 100% for hardware and licences advanced by IDITECHS; training is paid before the session). The balance is due on delivery, before go-live or final handover.",
        "Payment methods: Orange Money, cash against receipt, card via Stripe. A numbered receipt is issued for every payment.",
        "Invoices are payable within 7 days. If a reminder goes unanswered, interest at the statutory rate in force in Mali is due and the work may be suspended.",
      ],
    },
    {
      h: "4. Timelines",
      p: ["Timelines run from receipt of the deposit and of everything the client must provide (content, access, approvals). They are extended accordingly if the client is late or changes the scope."],
    },
    {
      h: "5. Client obligations",
      p: ["The client provides accurate and lawful content, access and information on time, appoints a contact person and approves each stage. The client warrants that it holds the rights to the texts, images, trademarks and data it entrusts to IDITECHS."],
    },
    {
      h: "6. Delivery, acceptance and revisions",
      p: ["Delivery is approved in writing (e-mail, WhatsApp or acceptance report). Without remarks within 7 days of delivery, the deliverable is deemed accepted. Revisions are performed within the limit set in the quote; beyond that they are invoiced."],
    },
    {
      h: "7. Warranty and maintenance",
      p: [
        "IDITECHS fixes free of charge, for 30 days after delivery, any non-conformity with the quote.",
        "Beyond that, changes and maintenance are covered by a monthly subscription or a quote. Excluded: changes made by the client or third parties, outages of external services (hosting, Meta/WhatsApp, Orange, Google) and hardware not supplied by IDITECHS.",
      ],
    },
    {
      h: "8. Hosting, domain names and third-party services",
      p: ["Hosting, domain names and third-party accounts are opened in the client's name whenever possible; their recurring fees remain the client's responsibility. IDITECHS is not liable for outages, changes of terms or pricing of those providers."],
    },
    {
      h: "9. Intellectual property",
      p: [
        "Upon full payment, the client owns the specific deliverables created for it (design, content, project-specific code). IDITECHS retains ownership of its tools, generic components and know-how, which it remains free to reuse.",
        "Unless the client refuses in writing, IDITECHS may cite the project as a reference (name, logo, screenshots).",
      ],
    },
    {
      h: "10. Cancellation and refunds",
      ul: [
        "Cancellation by the client before any work has started: the deposit is refunded in full.",
        "Cancellation after work has started: IDITECHS keeps the part of the deposit covering the work done and costs incurred; any surplus is refunded.",
        "Termination by IDITECHS without fault of the client: refund of the amounts corresponding to services not performed.",
        "Refunds are made through the original payment method; for card payments, via Stripe, within 10 business days.",
      ],
    },
    {
      h: "11. Liability",
      p: ["IDITECHS has a best-efforts obligation. Its liability is limited to the amount paid for the service concerned and excludes indirect losses (revenue, reputation, data not backed up by the client)."],
    },
    { h: "12. Personal data", p: ["Data processing is described in our privacy policy."] },
    {
      h: "13. Governing law and disputes",
      p: ["These terms are governed by Malian law. In case of disagreement, the parties first seek an amicable solution; failing that, the Commercial Court of Bamako has jurisdiction. Consumer clients living abroad keep the benefit of the mandatory provisions of their country."],
    },
  ],
};

export const legal: Record<Lang, Record<LegalKind, LegalDoc>> = {
  fr: { privacy: privacyFr, terms: termsFr },
  en: { privacy: privacyEn, terms: termsEn },
};

export const legalPath: Record<LegalKind, string> = { privacy: "/privacy", terms: "/terms" };
