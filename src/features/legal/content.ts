import type {AppLocale} from "@/i18n/routing";
import {organization} from "@/features/organization/info";

type LegalDoc = {
  slug: "imprint" | "privacy" | "terms";
  titleKey: "imprintTitle" | "privacyTitle" | "termsTitle";
  descriptionKey: "imprintDescription" | "privacyDescription" | "termsDescription";
  sections: Record<AppLocale, Array<{heading: string; paragraphs: string[]}>>;
};

const addressLine = `${organization.legalName}, ${organization.addresses.headquarters.street}, ${organization.addresses.headquarters.postalCode} ${organization.addresses.headquarters.city}`;

export const legalDocuments: LegalDoc[] = [
  {
    slug: "imprint",
    titleKey: "imprintTitle",
    descriptionKey: "imprintDescription",
    sections: {
      fr: [
        {
          heading: "Éditeur",
          paragraphs: [
            `${organization.legalName} édite le site mhp-coaching. Activité : formation en hypnose et coaching, ainsi que des services connexes de développement professionnel.`,
            `Siège : ${addressLine}. Téléphone : ${organization.phone}. E-mail : ${organization.email}.`,
            `Fondatrice et directrice : ${organization.founder}.`,
          ],
        },
      ],
      de: [
        {
          heading: "Herausgeber",
          paragraphs: [
            `${organization.legalName} gibt die Website mhp-coaching heraus. Tätigkeit: Hypnoseausbildung und Coaching sowie verbundene Dienstleistungen der beruflichen Entwicklung.`,
            `Sitz: ${addressLine}. Telefon: ${organization.phone}. E-Mail: ${organization.email}.`,
            `Gründerin und Direktorin: ${organization.founder}.`,
          ],
        },
      ],
      en: [
        {
          heading: "Publisher",
          paragraphs: [
            `${organization.legalName} publishes the mhp-coaching website. Activity: hypnosis training and coaching, and related professional-development services.`,
            `Registered office: ${addressLine}. Phone: ${organization.phone}. Email: ${organization.email}.`,
            `Founder and director: ${organization.founder}.`,
          ],
        },
      ],
    },
  },
  {
    slug: "privacy",
    titleKey: "privacyTitle",
    descriptionKey: "privacyDescription",
    sections: {
      fr: [
        {
          heading: "Données collectées",
          paragraphs: [
            "Lorsque vous réservez une formation, nous enregistrons prénom, nom, e-mail, téléphone, adresse postale, langue, formation et date choisies, le montant, l’état du paiement et les horodatages associés. Une inscription est enregistrée dès l’envoi du formulaire, y compris si le paiement en ligne n’est pas mené à terme. Les messages envoyés depuis le formulaire de contact sont également conservés. Nous ne créons pas de compte élève.",
          ],
        },
        {
          heading: "Finalités",
          paragraphs: [
            "Ces données servent à traiter l’inscription, confirmer le paiement, vous écrire, et tenir un registre interne fiable pour l’école. La base est l’exécution du contrat d’inscription et nos obligations comptables.",
          ],
        },
        {
          heading: "Paiement",
          paragraphs: [
            "Le paiement en ligne est traité par Stripe (TWINT, Visa, Mastercard). Stripe reçoit les données nécessaires au paiement. Le montant n’est jamais lu depuis le navigateur pour décider qu’une inscription est payée : seul un événement de paiement vérifié met à jour le statut.",
          ],
        },
        {
          heading: "Conservation et droits",
          paragraphs: [
            "Les inscriptions sont conservées aussi longtemps que nécessaire à la formation, à la comptabilité et aux obligations légales suisses. Pour accéder, corriger ou supprimer des données lorsque la loi le permet, écrivez à " +
              organization.email +
              ".",
          ],
        },
      ],
      de: [
        {
          heading: "Erhobene Daten",
          paragraphs: [
            "Bei einer Buchung speichern wir Vorname, Nachname, E-Mail, Telefon, Postadresse, Sprache, Kurs und Termin, Betrag, Zahlungsstatus und zugehörige Zeitstempel. Die Anmeldung wird beim Absenden des Formulars gespeichert, auch wenn die Online-Zahlung nicht abgeschlossen wird. Kontaktformular-Nachrichten werden ebenfalls aufbewahrt. Es gibt kein Schülerkonto.",
          ],
        },
        {
          heading: "Zwecke",
          paragraphs: [
            "Die Daten dienen der Anmeldung, der Zahlungsbestätigung, der E-Mail-Kommunikation und einem verlässlichen internen Register. Grundlage ist die Durchführung des Buchungsvertrags und unserer buchhalterischen Pflichten.",
          ],
        },
        {
          heading: "Zahlung",
          paragraphs: [
            "Online-Zahlungen verarbeitet Stripe (TWINT, Visa, Mastercard). Stripe erhält die für die Zahlung nötigen Daten. Der Betrag aus dem Browser entscheidet niemals über den Status «bezahlt»: nur ein verifiziertes Zahlungsereignis tut das.",
          ],
        },
        {
          heading: "Aufbewahrung und Rechte",
          paragraphs: [
            "Buchungen werden so lange aufbewahrt, wie Ausbildung, Buchhaltung und schweizerische Pflichten es erfordern. Für Auskunft, Berichtigung oder Löschung wo gesetzlich möglich schreiben Sie an " +
              organization.email +
              ".",
          ],
        },
      ],
      en: [
        {
          heading: "Data we collect",
          paragraphs: [
            "When you book a course we store first name, last name, email, phone, postal address, language, selected course and date, amount, payment status and related timestamps. The booking is stored when the form is submitted, including if online payment is not completed. Contact-form messages are also kept. We do not create a student account.",
          ],
        },
        {
          heading: "Purposes",
          paragraphs: [
            "We use this data to process the booking, confirm payment, email you, and keep a reliable internal record for the school. The legal basis is performing the booking contract and our accounting duties.",
          ],
        },
        {
          heading: "Payment",
          paragraphs: [
            "Online payment is processed by Stripe (TWINT, Visa, Mastercard). Stripe receives the data needed to take payment. Browser-supplied amounts never decide that a booking is paid: only a verified payment event updates that status.",
          ],
        },
        {
          heading: "Retention and rights",
          paragraphs: [
            "Bookings are kept as long as training, accounting and Swiss legal duties require. To access, correct or delete data where the law allows, write to " +
              organization.email +
              ".",
          ],
        },
      ],
    },
  },
  {
    slug: "terms",
    titleKey: "termsTitle",
    descriptionKey: "termsDescription",
    sections: {
      fr: [
        {
          heading: "Inscription",
          paragraphs: [
            "L’inscription en ligne crée une réservation en attente. Elle n’est confirmée comme payée qu’après un paiement réussi, confirmé par le prestataire. Le simple affichage de la page de succès ne suffit pas.",
          ],
        },
        {
          heading: "Prix et paiement",
          paragraphs: [
            "Les prix sont indiqués en francs suisses (CHF). Le paiement en ligne s’effectue par TWINT, Visa ou Mastercard via Stripe. Le montant facturé est celui publié pour la formation, jamais un montant saisi dans le navigateur.",
          ],
        },
        {
          heading: "Annulation",
          paragraphs: [
            "Un paiement interrompu ou refusé ne confirme pas de place. Pour un report ou une annulation après paiement, contactez l’école. Les conditions détaillées de report peuvent être précisées lors de la confirmation.",
          ],
        },
      ],
      de: [
        {
          heading: "Buchung",
          paragraphs: [
            "Die Online-Anmeldung erzeugt eine ausstehende Buchung. Als bezahlt gilt sie erst nach erfolgreicher, vom Anbieter bestätigter Zahlung. Das blosse Öffnen der Erfolgsseite reicht nicht.",
          ],
        },
        {
          heading: "Preis und Zahlung",
          paragraphs: [
            "Preise sind in Schweizer Franken (CHF) angegeben. Online zahlen Sie mit TWINT, Visa oder Mastercard über Stripe. Der verrechnete Betrag ist der veröffentlichte Kurspreis, niemals ein Betrag aus dem Browser.",
          ],
        },
        {
          heading: "Stornierung",
          paragraphs: [
            "Ein abgebrochener oder abgelehnter Checkout bestätigt keinen Platz. Für Verschiebung oder Storno nach Zahlung kontaktieren Sie die Schule.",
          ],
        },
      ],
      en: [
        {
          heading: "Booking",
          paragraphs: [
            "An online registration creates a pending booking. It is marked paid only after successful payment confirmed by the provider. Loading the success page is not enough.",
          ],
        },
        {
          heading: "Price and payment",
          paragraphs: [
            "Prices are in Swiss francs (CHF). Online payment is by TWINT, Visa or Mastercard via Stripe. The charged amount is the published course price, never an amount supplied by the browser.",
          ],
        },
        {
          heading: "Cancellation",
          paragraphs: [
            "An interrupted or declined checkout does not confirm a place. For a postponement or cancellation after payment, contact the school.",
          ],
        },
      ],
    },
  },
];

export function getLegalDocument(slug: LegalDoc["slug"]): LegalDoc | undefined {
  return legalDocuments.find((document) => document.slug === slug);
}
