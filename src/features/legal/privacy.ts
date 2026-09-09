import {formatPostalAddress, organization} from "@/features/organization/info";

import type {LegalDoc} from "./types";

const registered = formatPostalAddress(organization.addresses.headquarters);

export const privacyDocument = {
  slug: "privacy",
  pathname: "/legal/privacy",
  titleKey: "privacyTitle",
  descriptionKey: "privacyDescription",
  updatedAt: "2026-09-09",
  sections: {
    fr: [
      {
        heading: "Responsable du traitement",
        paragraphs: [
          `${organization.legalName}, ${registered}, est responsable du traitement des données personnelles collectées via mhp-coaching.`,
          `Pour toute question relative à vos données, écrivez à ${organization.email} ou appelez le ${organization.phone}.`,
          "Cette déclaration décrit le traitement au regard de la loi fédérale suisse sur la protection des données (nLPD) et, lorsque le règlement (UE) 2016/679 (RGPD) s’applique, notamment si vous résidez dans l’Union européenne ou l’Espace économique européen.",
        ],
      },
      {
        heading: "Données collectées",
        paragraphs: [
          "Nous ne créons pas de compte élève. Les données sont collectées uniquement lorsque vous les fournissez ou lorsque le prestataire de paiement nous confirme une transaction.",
        ],
        items: [
          "Inscription à une formation : prénom, nom, e-mail, téléphone, adresse postale (rue, code postal, localité, pays), langue, formation et session choisies, montant, monnaie, état du paiement et horodatages associés. L’inscription est enregistrée dès l’envoi du formulaire, y compris si le paiement en ligne n’est pas mené à terme.",
          "Liste d’attente : prénom, nom, e-mail, téléphone, langue, formation concernée.",
          "Formulaire de contact et demande d’un autre moyen de paiement : nom, e-mail, téléphone le cas échéant, message, langue, et éventuellement la formation ou la réservation concernée.",
          "Paiement : Stripe nous communique le statut de la transaction, un identifiant de paiement et les métadonnées nécessaires à la comptabilité. Nous ne stockons pas le numéro complet de carte ni le secret TWINT.",
          "Mesure d’audience : Vercel Analytics enregistre des statistiques d’usage agrégées, sans cookie et sans identifier nominativement les visiteurs.",
        ],
      },
      {
        heading: "Finalités et bases juridiques",
        paragraphs: [
          "Les traitements visent à exécuter l’inscription, confirmer le paiement, vous écrire, tenir le registre de l’école, répondre aux messages, vous prévenir lorsqu’une session s’ouvre, et respecter les obligations comptables et légales suisses.",
          "Bases : exécution du contrat d’inscription ou mesures précontractuelles ; obligations légales (comptabilité, fiscalité) ; intérêt légitime à exploiter un site sûr et à mesurer son audience de façon agrégée ; consentement lorsque vous acceptez cette notice avant d’envoyer un formulaire.",
        ],
      },
      {
        heading: "Paiement (TWINT, Visa, Mastercard)",
        paragraphs: [
          "Le paiement en ligne est traité par Stripe. Les moyens proposés sont TWINT (en francs suisses uniquement), Visa et Mastercard. Stripe agit comme sous-traitant / prestataire de paiement et reçoit les données nécessaires à l’encaissement.",
          "Le montant facturé est celui publié pour la formation. Un montant saisi dans le navigateur ne décide jamais qu’une inscription est payée : seul un événement de paiement vérifié met à jour le statut.",
        ],
      },
      {
        heading: "Sous-traitants et transferts",
        paragraphs: [
          "Nous faisons appel à des prestataires pour héberger le site, la base de données, le paiement et l’envoi des e-mails transactionnels. L’hébergement applicatif est assuré par Vercel. La base PostgreSQL est hébergée dans l’Union européenne. Stripe et, selon la configuration, le prestataire d’e-mail peuvent traiter des données aux États-Unis ou dans d’autres pays.",
          "Lorsque des données sont transférées hors de Suisse ou de l’EEE, nous nous appuyons sur les mécanismes prévus par la nLPD et le RGPD, notamment les clauses contractuelles types ou une décision d’adéquation lorsqu’elle existe.",
        ],
      },
      {
        heading: "Cookies et traceurs",
        paragraphs: [
          "Aucun bandeau de consentement n’est affiché : le site n’installe pas de cookies non essentiels (publicité, profilage, mesure d’audience par cookie).",
          "La langue est dans l’URL (/fr, /de, /en) ; aucun cookie de langue n’est déposé. Vercel Analytics mesure l’audience de façon agrégée, sans cookie et sans suivre les visiteurs d’un jour à l’autre ou d’un site à l’autre.",
          "Stripe peut déposer des cookies strictement nécessaires sur ses propres pages de paiement lorsque vous payez par TWINT, Visa ou Mastercard. Ces cookies servent à exécuter le paiement que vous avez demandé.",
          "Si des traceurs non essentiels étaient ajoutés plus tard, un consentement préalable serait demandé avant leur activation.",
        ],
      },
      {
        heading: "Durées de conservation",
        paragraphs: [
          "Les inscriptions, événements de paiement et pièces comptables sont conservés aussi longtemps que les obligations suisses de conservation l’exigent, en principe dix ans.",
          "Les demandes de liste d’attente sont conservées jusqu’à ce que la session soit communiquée ou que vous demandiez la suppression, et au plus tard vingt-quatre mois après l’inscription sur la liste.",
          "Les messages de contact sont conservés le temps de traiter la demande, puis au plus deux ans, sauf besoin légal plus long.",
        ],
      },
      {
        heading: "Vos droits",
        paragraphs: [
          "Vous pouvez demander l’accès, la rectification, la suppression, la limitation, la portabilité lorsque le droit l’exige, et vous opposer à certains traitements. Écrivez à " +
            organization.email +
            ". Nous répondons dans les délais légaux. Le droit à l’effacement ne s’applique pas lorsque la conservation est obligatoire, notamment pour la comptabilité.",
          "Vous pouvez introduire une plainte auprès du Préposé fédéral à la protection des données et à la transparence (PFPDT) en Suisse. Si le RGPD s’applique, vous pouvez également saisir l’autorité de contrôle de votre lieu de résidence dans l’UE ou l’EEE.",
        ],
      },
    ],
    de: [
      {
        heading: "Verantwortliche Stelle",
        paragraphs: [
          `${organization.legalName}, ${registered}, ist verantwortlich für die Verarbeitung personenbezogener Daten über mhp-coaching.`,
          `Fragen zu Ihren Daten richten Sie an ${organization.email} oder telefonisch an ${organization.phone}.`,
          "Diese Erklärung beschreibt die Verarbeitung nach dem schweizerischen Datenschutzgesetz (revDSG) und, soweit die Verordnung (EU) 2016/679 (DSGVO) gilt, insbesondere wenn Sie in der EU oder im EWR wohnen.",
        ],
      },
      {
        heading: "Welche Daten wir erheben",
        paragraphs: [
          "Es gibt kein Schülerkonto. Daten entstehen nur, wenn Sie sie angeben oder der Zahlungsanbieter eine Transaktion bestätigt.",
        ],
        items: [
          "Kursanmeldung: Vorname, Nachname, E-Mail, Telefon, Postadresse (Strasse, PLZ, Ort, Land), Sprache, Kurs und Termin, Betrag, Währung, Zahlungsstatus und zugehörige Zeitstempel. Die Anmeldung wird beim Absenden gespeichert, auch wenn die Online-Zahlung nicht abgeschlossen wird.",
          "Warteliste: Vorname, Nachname, E-Mail, Telefon, Sprache, betroffener Kurs.",
          "Kontaktformular und Wunsch nach einem anderen Zahlungsmittel: Name, E-Mail, gegebenenfalls Telefon, Nachricht, Sprache sowie gegebenenfalls Kurs oder Buchung.",
          "Zahlung: Stripe übermittelt Transaktionsstatus, eine Zahlungsreferenz und buchhalterisch nötige Metadaten. Wir speichern keine vollständige Kartennummer und kein TWINT-Geheimnis.",
          "Reichweitenmessung: Vercel Analytics erfasst aggregierte Nutzungsstatistiken ohne Cookies und ohne namentliche Identifikation.",
        ],
      },
      {
        heading: "Zwecke und Rechtsgrundlagen",
        paragraphs: [
          "Die Daten dienen der Anmeldung, der Zahlungsbestätigung, der Korrespondenz, dem internen Register, der Beantwortung von Nachrichten, der Information bei neuen Terminen sowie gesetzlichen Buchführungs- und Aufbewahrungspflichten.",
          "Grundlagen: Vertragserfüllung bzw. vorvertragliche Massnahmen; gesetzliche Pflichten; berechtigtes Interesse an einem sicheren Betrieb und einer aggregierten Reichweitenmessung; Einwilligung, wenn Sie diesen Hinweis vor dem Absenden eines Formulars akzeptieren.",
        ],
      },
      {
        heading: "Zahlung (TWINT, Visa, Mastercard)",
        paragraphs: [
          "Online-Zahlungen verarbeitet Stripe. Angeboten werden TWINT (nur in Schweizer Franken), Visa und Mastercard. Stripe erhält die für die Zahlung erforderlichen Daten.",
          "Verrechnet wird der veröffentlichte Kurspreis. Ein Betrag aus dem Browser entscheidet niemals über den Status «bezahlt»: nur ein verifiziertes Zahlungsereignis tut das.",
        ],
      },
      {
        heading: "Auftragsverarbeiter und Übermittlungen",
        paragraphs: [
          "Wir nutzen Dienstleister für Hosting, Datenbank, Zahlung und transaktionale E-Mails. Die Anwendung hostet Vercel. Die PostgreSQL-Datenbank steht in der EU. Stripe und je nach Konfiguration der E-Mail-Anbieter können Daten in den USA oder anderen Staaten verarbeiten.",
          "Übermittlungen aus der Schweiz oder dem EWR stützen sich auf die vom revDSG und der DSGVO vorgesehenen Grundlagen, insbesondere Standardvertragsklauseln oder einen Angemessenheitsbeschluss.",
        ],
      },
      {
        heading: "Cookies und Tracker",
        paragraphs: [
          "Es wird kein Einwilligungsbanner angezeigt: die Website setzt keine nicht notwendigen Cookies (Werbung, Profiling, Reichweitenmessung per Cookie).",
          "Die Sprache steht in der URL (/fr, /de, /en); es wird kein Sprach-Cookie gesetzt. Vercel Analytics misst die Nutzung aggregiert, ohne Cookie und ohne Besucher über Tage oder Websites hinweg zu verfolgen.",
          "Stripe kann auf den eigenen Zahlungsseiten technisch notwendige Cookies setzen, wenn Sie mit TWINT, Visa oder Mastercard bezahlen. Diese Cookies dienen der von Ihnen angeforderten Zahlung.",
          "Würden später nicht notwendige Tracker ergänzt, wäre zuvor eine Einwilligung einzuholen.",
        ],
      },
      {
        heading: "Aufbewahrung",
        paragraphs: [
          "Anmeldungen, Zahlungsereignisse und Buchungsbelege werden so lange aufbewahrt, wie schweizerische Aufbewahrungspflichten es verlangen, in der Regel zehn Jahre.",
          "Wartelisteneinträge bleiben bis zur Information über einen Termin oder bis zu Ihrem Löschantrag, längstens vierundzwanzig Monate nach Eintrag.",
          "Kontaktnachrichten werden für die Bearbeitung aufbewahrt, danach höchstens zwei Jahre, sofern kein längerer gesetzlicher Grund besteht.",
        ],
      },
      {
        heading: "Ihre Rechte",
        paragraphs: [
          "Sie können Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit soweit gesetzlich vorgesehen und Widerspruch verlangen. Schreiben Sie an " +
            organization.email +
            ". Löschung ist ausgeschlossen, soweit eine Aufbewahrungspflicht besteht, namentlich in der Buchhaltung.",
          "Sie können sich beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) beschweren. Gilt die DSGVO, können Sie auch die Aufsichtsbehörde an Ihrem Wohnsitz in der EU oder im EWR anrufen.",
        ],
      },
    ],
    en: [
      {
        heading: "Controller",
        paragraphs: [
          `${organization.legalName}, ${registered}, is the controller of personal data collected through mhp-coaching.`,
          `For questions about your data, write to ${organization.email} or call ${organization.phone}.`,
          "This notice describes processing under the Swiss Federal Act on Data Protection (FADP) and, where Regulation (EU) 2016/679 (GDPR) applies — in particular if you live in the EU or EEA.",
        ],
      },
      {
        heading: "Data we collect",
        paragraphs: [
          "We do not create student accounts. Data is collected only when you provide it or when the payment provider confirms a transaction.",
        ],
        items: [
          "Course booking: first name, last name, email, phone, postal address (street, postcode, city, country), language, selected course and session, amount, currency, payment status and related timestamps. The booking is stored when the form is submitted, including if online payment is not completed.",
          "Waiting list: first name, last name, email, phone, language, course concerned.",
          "Contact form and request for another payment method: name, email, phone if provided, message, language, and optionally the related course or booking.",
          "Payment: Stripe sends transaction status, a payment reference and metadata needed for accounting. We do not store full card numbers or TWINT secrets.",
          "Audience measurement: Vercel Analytics records aggregated usage statistics without cookies and without naming visitors.",
        ],
      },
      {
        heading: "Purposes and legal bases",
        paragraphs: [
          "We use the data to process enrolment, confirm payment, write to you, keep the school’s register, answer messages, notify you when a session opens, and meet Swiss accounting and legal duties.",
          "Bases: performance of the booking contract or pre-contractual steps; legal obligations (accounts, tax); legitimate interest in running a secure site and measuring aggregated traffic; consent when you accept this notice before submitting a form.",
        ],
      },
      {
        heading: "Payment (TWINT, Visa, Mastercard)",
        paragraphs: [
          "Online payment is processed by Stripe. Available methods are TWINT (Swiss francs only), Visa and Mastercard. Stripe receives the data needed to take payment.",
          "The charged amount is the published course price. A browser-supplied amount never decides that a booking is paid: only a verified payment event does.",
        ],
      },
      {
        heading: "Processors and transfers",
        paragraphs: [
          "We use providers to host the site, database, payments and transactional email. Application hosting is with Vercel. The PostgreSQL database is hosted in the EU. Stripe and, depending on configuration, the email provider may process data in the United States or other countries.",
          "Transfers out of Switzerland or the EEA rely on mechanisms provided by the FADP and GDPR, in particular standard contractual clauses or an adequacy decision where one exists.",
        ],
      },
      {
        heading: "Cookies and trackers",
        paragraphs: [
          "No consent banner is shown: the site does not set non-essential cookies (advertising, profiling, cookie-based analytics).",
          "The language is in the URL (/fr, /de, /en); no language cookie is stored. Vercel Analytics measures aggregated usage without cookies and without tracking visitors across days or websites.",
          "Stripe may set strictly necessary cookies on its own checkout pages when you pay with TWINT, Visa or Mastercard. Those cookies exist to complete the payment you requested.",
          "If non-essential trackers were added later, prior consent would be required before they run.",
        ],
      },
      {
        heading: "Retention",
        paragraphs: [
          "Bookings, payment events and accounting records are kept as long as Swiss retention duties require, generally ten years.",
          "Waiting-list requests are kept until a session is communicated or you ask for deletion, and no longer than twenty-four months after joining the list.",
          "Contact messages are kept while we handle the request, then at most two years unless a longer legal need applies.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You may request access, rectification, erasure, restriction, portability where the law requires it, and object to certain processing. Write to " +
            organization.email +
            ". Erasure does not apply where retention is mandatory, in particular for accounting.",
          "You may lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (FDPIC). If the GDPR applies, you may also contact the supervisory authority in your EU or EEA country of residence.",
        ],
      },
    ],
  },
} as const satisfies LegalDoc;
