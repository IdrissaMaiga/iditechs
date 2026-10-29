import { company } from "@/lib/company";

export type Lang = "fr" | "en";

const fr = {
  meta: {
    title: "IDITECHS · Services informatiques à Bamako",
    description:
      "Sites web, logiciels métier, installation informatique et formation pour les écoles, commerces, cliniques, restaurants et ONG de Bamako. Devis sous 48 h, acompte 50 %, reçu à chaque paiement.",
    ogDescription:
      "Sites web, logiciels métier, installation informatique et formation pour les entreprises de Bamako. Entreprise immatriculée au RCCM.",
    ogAlt: "IDITECHS · services informatiques à Bamako",
    locale: "fr_ML",
    keywords: [
      "création site web Bamako",
      "développeur web Mali",
      "site internet entreprise Bamako",
      "logiciel de gestion Mali",
      "boutique en ligne Bamako",
      "installation informatique Bamako",
      "formation informatique Mali",
      "IDITECHS",
    ],
  },
  nav: { services: "Services", process: "Comment ça marche", about: "À propos", contact: "Contact", whatsapp: "WhatsApp" },
  hero: {
    eyebrow: "Services informatiques · Bamako",
    title: "Votre entreprise, visible et organisée.",
    lead: "Sites web, boutiques en ligne, logiciels métier, installation informatique et formation pour les écoles, commerces, cliniques, restaurants et ONG de Bamako. Livré à date fixe, avec formation et garantie.",
    cta: "Demander un devis sur WhatsApp",
    follow: "Suivez-nous",
    waPrefill: "Bonjour IDITECHS, je souhaite un devis pour ",
  },
  trust: [
    ["RCCM", company.rccm, "Entreprise immatriculée à Bamako"],
    ["D-U-N-S", company.duns, "Identifiant international Dun & Bradstreet"],
    ["48 h", "Devis écrit", "Prix, délai et contenu, valable 30 jours"],
    ["30 jours", "Garantie", "Corrections gratuites après livraison"],
  ],
  services: {
    eyebrow: "Services",
    title: "Ce que nous faisons",
    lead: "Pas d'inventaire, pas de surprise : chaque prestation démarre par un devis écrit et un acompte, et se termine par une livraison, une formation et un reçu.",
    items: [
      { title: "Site vitrine", desc: "5 à 8 pages, trouvable sur Google, bouton WhatsApp, formation à la mise à jour.", meta: "3 à 10 jours · acompte 50 %" },
      { title: "Site & boutique en ligne", desc: "Catalogue, commandes par WhatsApp, paiement Orange Money, gestion depuis le téléphone.", meta: "2 à 4 semaines · acompte 50 %" },
      { title: "Logiciel métier", desc: "Inscriptions, facturation, stock, rendez-vous, suivi de livraisons : un outil simple fait pour votre activité.", meta: "2 à 8 semaines · acompte 50 %" },
      { title: "Installation & réseau", desc: "Ordinateurs, imprimantes, Wi-Fi, sauvegardes, sécurité de base pour un bureau ou un commerce.", meta: "Sur devis · acompte 70 à 100 %" },
      { title: "Formation", desc: "Vos équipes autonomes sur vos outils, WhatsApp Business, Google Maps, bureautique.", meta: "Par session · réglée avant la séance" },
      { title: "Maintenance mensuelle", desc: "Mises à jour, sauvegardes, corrections et petites évolutions, avec un interlocuteur unique.", meta: "Abonnement mensuel" },
    ],
  },
  process: {
    eyebrow: "Méthode",
    title: "Comment ça marche",
    lead: "Cinq étapes, toujours les mêmes, du premier message à la garantie.",
    steps: [
      ["1", "Échange", "Un appel ou une discussion WhatsApp de 15 minutes pour comprendre votre besoin."],
      ["2", "Devis sous 48 h", "Un devis clair : ce qui est inclus, le délai, le prix. Valable 30 jours."],
      ["3", "Acompte et démarrage", "Vous répondez « bon pour accord » et versez l'acompte par Orange Money. Le travail commence."],
      ["4", "Livraison et formation", "Vous validez, vous êtes formé, vous réglez le solde. Un reçu à chaque paiement."],
      ["5", "Garantie 30 jours", "Corrections gratuites pendant 30 jours, puis maintenance si vous le souhaitez."],
    ],
  },
  about: {
    eyebrow: "À propos",
    title: "Pourquoi IDITECHS",
    bullets: [
      ["Une entreprise enregistrée.", `IDITECHS est immatriculée au Registre du Commerce de Bamako (${company.rccm}). Vous recevez un devis, une facture et un reçu pour chaque paiement.`],
      ["Un ingénieur, pas un intermédiaire.", `Le travail est réalisé par ${company.owner}, ingénieur logiciel, qui construit des applications pour des entreprises en Europe et au Mali.`],
      ["Bamako et à distance.", "Rendez-vous sur place à Bamako pour la signature, la formation et l'installation ; suivi quotidien par WhatsApp."],
      ["Paiement simple.", "Orange Money ou espèces contre reçu. Acompte pour démarrer, solde à la livraison."],
    ],
    portfolioLink: "Voir le parcours et les projets du fondateur →",
    forWhom: "Pour qui",
    audiences: [
      "Écoles et centres de formation",
      "Pharmacies et cliniques",
      "Restaurants et livraison",
      "Boutiques et vendeurs en ligne",
      "ONG et associations",
      "Salons et prestataires sur rendez-vous",
    ],
    otherLang: {
      title: "In English",
      text: "IDITECHS is a registered IT services business in Bamako, Mali: websites, small business software, office IT setup and training, delivered on a fixed date with a written quote, a deposit and a receipt for every payment. We work with NGOs and companies abroad remotely.",
      link: "Read this page in English →",
    },
  },
  contact: {
    eyebrow: "Contact",
    title: "Parlons de votre projet",
    lead: "Réponse sous 24 h ouvrées. Le plus rapide reste WhatsApp.",
    phone: "WhatsApp / Téléphone",
    email: "Email",
    address: "Adresse",
    cta: "Écrire sur WhatsApp",
  },
  footer: {
    tagline: "Services informatiques à Bamako. Sites web, logiciels métier, installation et formation.",
    services: "Services",
    company: "Entreprise",
    contact: "Contact",
    offers: "Offres du moment",
    portfolio: "Portfolio du fondateur",
    rights: "Tous droits réservés.",
  },
};

const en: typeof fr = {
  meta: {
    title: "IDITECHS · IT services in Bamako, Mali",
    description:
      "Websites, business software, IT setup and training for schools, shops, clinics, restaurants and NGOs in Bamako. Quote within 48 h, 50% deposit, receipt for every payment.",
    ogDescription:
      "Websites, business software, IT setup and training for businesses in Bamako. Registered with the Bamako Trade Register.",
    ogAlt: "IDITECHS · IT services in Bamako",
    locale: "en_US",
    keywords: [
      "web development Bamako",
      "IT services Mali",
      "business website Bamako",
      "business software Mali",
      "online shop Bamako",
      "IT setup Bamako",
      "IT training Mali",
      "IDITECHS",
    ],
  },
  nav: { services: "Services", process: "How it works", about: "About", contact: "Contact", whatsapp: "WhatsApp" },
  hero: {
    eyebrow: "IT services · Bamako",
    title: "Your business, visible and organised.",
    lead: "Websites, online shops, business software, IT setup and training for schools, shops, clinics, restaurants and NGOs in Bamako. Delivered on a fixed date, with training and a warranty.",
    cta: "Request a quote on WhatsApp",
    follow: "Follow us",
    waPrefill: "Hello IDITECHS, I would like a quote for ",
  },
  trust: [
    ["RCCM", company.rccm, "Business registered in Bamako"],
    ["D-U-N-S", company.duns, "Dun & Bradstreet international identifier"],
    ["48 h", "Written quote", "Price, timeline and scope, valid 30 days"],
    ["30 days", "Warranty", "Free fixes after delivery"],
  ],
  services: {
    eyebrow: "Services",
    title: "What we do",
    lead: "No surprises: every job starts with a written quote and a deposit, and ends with a delivery, training and a receipt.",
    items: [
      { title: "Business website", desc: "5 to 8 pages, found on Google, WhatsApp button, training so you can update it yourself.", meta: "3 to 10 days · 50% deposit" },
      { title: "Website & online shop", desc: "Catalogue, orders via WhatsApp, Orange Money payment, managed from your phone.", meta: "2 to 4 weeks · 50% deposit" },
      { title: "Business software", desc: "Enrolments, invoicing, stock, appointments, delivery tracking: a simple tool built for your activity.", meta: "2 to 8 weeks · 50% deposit" },
      { title: "IT setup & network", desc: "Computers, printers, Wi-Fi, backups, basic security for an office or a shop.", meta: "On quote · 70 to 100% deposit" },
      { title: "Training", desc: "Your team self-sufficient on your tools, WhatsApp Business, Google Maps, office software.", meta: "Per session · paid before the session" },
      { title: "Monthly maintenance", desc: "Updates, backups, fixes and small improvements, with a single point of contact.", meta: "Monthly subscription" },
    ],
  },
  process: {
    eyebrow: "Method",
    title: "How it works",
    lead: "Five steps, always the same, from the first message to the warranty.",
    steps: [
      ["1", "Conversation", "A 15-minute call or WhatsApp chat to understand your need."],
      ["2", "Quote within 48 h", "A clear quote: what is included, the timeline, the price. Valid 30 days."],
      ["3", "Deposit and kick-off", "You reply “agreed” and pay the deposit via Orange Money. Work begins."],
      ["4", "Delivery and training", "You approve, you are trained, you pay the balance. A receipt for every payment."],
      ["5", "30-day warranty", "Free fixes for 30 days, then maintenance if you wish."],
    ],
  },
  about: {
    eyebrow: "About",
    title: "Why IDITECHS",
    bullets: [
      ["A registered business.", `IDITECHS is registered with the Bamako Trade Register (${company.rccm}). You receive a quote, an invoice and a receipt for every payment.`],
      ["An engineer, not a middleman.", `The work is done by ${company.owner}, a software engineer who builds applications for companies in Europe and Mali.`],
      ["In Bamako and remotely.", "On-site meetings in Bamako for signing, training and installation; daily follow-up on WhatsApp."],
      ["Simple payment.", "Orange Money or cash against receipt. A deposit to start, the balance on delivery."],
    ],
    portfolioLink: "See the founder's background and projects →",
    forWhom: "Who it's for",
    audiences: [
      "Schools and training centres",
      "Pharmacies and clinics",
      "Restaurants and delivery services",
      "Shops and online sellers",
      "NGOs and associations",
      "Salons and appointment-based services",
    ],
    otherLang: {
      title: "En français",
      text: "IDITECHS est une entreprise de services informatiques immatriculée à Bamako (Mali) : sites web, logiciels pour petites entreprises, installation informatique et formation, livrés à date fixe avec devis écrit, acompte et reçu à chaque paiement. Nous travaillons aussi à distance avec des ONG et des entreprises à l'étranger.",
      link: "Lire cette page en français →",
    },
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk about your project",
    lead: "Reply within 24 business hours. WhatsApp is the fastest.",
    phone: "WhatsApp / Phone",
    email: "Email",
    address: "Address",
    cta: "Message us on WhatsApp",
  },
  footer: {
    tagline: "IT services in Bamako. Websites, business software, setup and training.",
    services: "Services",
    company: "Company",
    contact: "Contact",
    offers: "Current offers",
    portfolio: "Founder's portfolio",
    rights: "All rights reserved.",
  },
};

export const copy: Record<Lang, typeof fr> = { fr, en };
