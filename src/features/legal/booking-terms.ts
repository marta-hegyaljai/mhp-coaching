import {formatPostalAddress, organization} from "@/features/organization/info";

import type {LegalDoc} from "./types";

const registered = formatPostalAddress(organization.addresses.headquarters);

export const termsDocument = {
  slug: "terms",
  pathname: "/legal/terms",
  titleKey: "termsTitle",
  descriptionKey: "termsDescription",
  updatedAt: "2026-09-09",
  sections: {
    fr: [
      {
        heading: "Article 1 – Objet",
        paragraphs: [
          `Les présentes conditions générales d’inscription (CGI) régissent le contrat entre ${organization.legalName}, siège ${registered} (ci-après « l’École »), et toute personne qui réserve une formation, un atelier ou un séminaire proposé sur mhp-coaching (ci-après le « Participant »).`,
          "En envoyant le formulaire d’inscription, le Participant accepte ces CGI sans réserve. Les termes désignant des personnes valent au féminin et au masculin.",
        ],
      },
      {
        heading: "Article 2 – Prix",
        paragraphs: [
          "Les prix sont indiqués en francs suisses (CHF), toutes taxes comprises au jour de l’inscription. Le paiement en ligne s’effectue en CHF. L’École peut modifier ses tarifs à tout moment ; la facturation suit le tarif publié au moment de l’inscription.",
          "Le montant encaissé est celui publié pour la formation, jamais un montant saisi dans le navigateur.",
        ],
      },
      {
        heading: "Article 3 – Inscription",
        paragraphs: [
          "L’inscription se fait en ligne sur mhp-coaching, pour une session datée. Une formation sans date publiée ne peut pas être achetée ; une liste d’attente peut être proposée. S’inscrire sur liste d’attente ne réserve pas de place et n’ouvre pas d’obligation de paiement.",
        ],
        items: [
          "L’envoi du formulaire crée une réservation en attente. Elle n’est confirmée comme payée qu’après un paiement réussi, confirmé par le prestataire. L’affichage de la page de succès ne suffit pas.",
          "Les places sont limitées et attribuées tant que la session figure sur le site.",
          "Si la session est complète, le Participant peut rejoindre la liste d’attente et sera prévenu par e-mail en cas de désistement ou d’ouverture de place.",
        ],
      },
      {
        heading: "Article 4 – Admission",
        paragraphs: [
          "Le Participant doit remplir les prérequis indiqués sur la page de la formation. Il lui appartient de les vérifier avant de s’inscrire. L’École peut accepter ou refuser une inscription, en tout ou partie.",
          `Les demandes d’équivalence doivent être adressées à ${organization.email} avant l’inscription.`,
        ],
      },
      {
        heading: "Article 5 – Paiement",
        paragraphs: [
          "Délai de rétractation contractuel : 10 jours à compter de la date d’inscription, tant que la formation n’a pas commencé. Dans ce délai, le Participant peut se retirer par écrit à " +
            organization.email +
            ". Les sommes payées sont alors remboursées. Un remboursement sur le moyen de paiement d’origine peut être soumis aux frais de transaction et d’administration prévus à l’article 6 (5 % du prix du cours) ; un avoir pour une formation ultérieure est possible sans ces frais.",
          "Pour les formations avec une date précise, le droit européen de rétractation de 14 jours applicable à certains contrats à distance ne s’applique généralement pas une fois la session choisie. Le délai contractuel de 10 jours ci-dessus reste accordé par l’École.",
        ],
        items: [
          "Paiement en ligne : TWINT (CHF uniquement), Visa ou Mastercard, via Stripe. Le paiement est dû au moment du paiement en ligne.",
          "Autre moyen de paiement : le Participant peut le demander via le formulaire prévu. Une facture peut alors être émise. Le délai de paiement est de 30 jours, sauf pour la formation de Praticien·ne en Hypnose OMNI, dont le paiement intégral est requis avant le premier jour de formation.",
          "Paiement échelonné : possible sur demande, sans frais supplémentaires. Un acompte de 30 % du prix du cours est alors dû ; le solde est convenu avec l’École.",
        ],
      },
      {
        heading: "Article 6 – Report, annulation ou abandon",
        paragraphs: [
          `Les demandes de report ou d’annulation après le délai de l’article 5 se font par écrit à ${organization.email} ou via le formulaire de contact.`,
        ],
        items: [
          "Plus de 7 jours francs avant le début de la formation : report possible sans frais. Le montant payé est crédité sous forme d’avoir, utilisable pour une formation ultérieure.",
          "Moins de 7 jours francs avant le début : 30 % du prix de la formation reste dû. Le solde est crédité sous forme d’avoir.",
          "Absence non annoncée par écrit : le prix total reste dû.",
          "Force majeure du Participant, sur justificatif : report sans frais supplémentaires.",
          "Remboursement d’un avoir : possible sur demande, avec des frais de transaction et d’administration égaux à 5 % du prix du cours.",
          "Le non-paiement n’équivaut pas à un retrait de l’inscription.",
        ],
      },
      {
        heading: "Article 7 – Annulation par l’École",
        paragraphs: [
          "L’École peut annuler une formation jusqu’à 7 jours avant la date prévue. Les sommes versées sont alors intégralement remboursées, ou le Participant peut s’inscrire à une session équivalente selon les places disponibles.",
          "En cas de force majeure, les sessions sont reportées sans remboursement ; le Participant choisit parmi les dates de remplacement proposées. L’École peut aussi modifier le format (présentiel / à distance) sans obligation de remboursement.",
        ],
      },
      {
        heading: "Article 8 – Certification",
        paragraphs: [
          "La certification n’est délivrée que si le candidat a suivi la formation dans son intégralité, sous réserve des modalités propres à chaque cursus publiées sur la page de la formation.",
          "Pour la formation de Praticien·ne en Hypnose OMNI, la réussite des examens théorique et pratique est requise. En cas d’échec, les examens peuvent être représentés ; des frais supplémentaires peuvent s’appliquer.",
          "Pour les formations continues, la présence sur toute la durée de la session est requise pour la certification.",
          "Pour l’examen final de Maître Praticien·ne, la validation du travail (rapport et présentation) est requise. Un échec peut être rattrapé ; des frais supplémentaires peuvent s’appliquer.",
        ],
      },
      {
        heading: "Article 9 – Propriété intellectuelle",
        paragraphs: [
          "Sauf mention contraire, le matériel pédagogique créé par l’École est publié sous licence Creative Commons Attribution 4.0 International (CC BY 4.0). Le Participant peut le partager et l’adapter, y compris à des fins commerciales, à condition de créditer l’œuvre, d’indiquer la licence et de signaler les modifications. Les détails figurent dans la page Droits d’auteur.",
          "Le matériel de la formation de Praticien·ne en Hypnose OMNI est la propriété intellectuelle de OMNI Hypnosis Training Center International (Hypnose.net GmbH) ; l’École détient les droits d’auteur des traductions françaises. Ce matériel ne peut pas être reproduit pour diffusion à des tiers. Un accord distinct sur les droits d’auteur peut devoir être signé.",
        ],
      },
      {
        heading: "Article 10 – Confidentialité en formation",
        paragraphs: [
          "Tout ce qui est dit ou échangé en formation est confidentiel. Les participant·e·s ne sont pas autorisé·e·s à enregistrer, photographier ou filmer les contenus, échanges ou démonstrations, sauf autorisation écrite préalable de l’École.",
          "Une violation peut entraîner une exclusion immédiate sans remboursement et, si nécessaire, des actions légales.",
        ],
      },
      {
        heading: "Article 11 – Informations de session",
        paragraphs: [
          "Le lieu, le formateur, les horaires et les autres détails de session sont indiqués sur la page de la formation et confirmés par e-mail. Ils peuvent encore changer jusqu’à la convocation. Les modifications substantielles après confirmation sont communiquées par e-mail.",
        ],
      },
      {
        heading: "Article 12 – Droit à l’image",
        paragraphs: [
          "En participant, le Participant accepte que son image puisse être captée (photographies, vidéos) à des fins pédagogiques, promotionnelles ou de communication, sous réserve d’anonymat lorsque cela est approprié. Les captations ne sont pas vendues à des tiers ni utilisées à d’autres fins commerciales sans consentement explicite.",
          `Le refus d’utilisation de l’image peut être notifié à tout moment par écrit à ${organization.email}, avant la formation ou au moment de la captation.`,
        ],
      },
      {
        heading: "Article 13 – Responsabilité",
        paragraphs: [
          "L’École n’est pas responsable des dommages indirects (perte de profit, de revenus, d’exploitation ou de données, frais du Participant) liés à l’utilisation des services, même si elle a été informée de leur possibilité.",
          "L’École décline toute responsabilité en cas de perte ou de vol d’effets personnels. Les participant·e·s assurent eux-mêmes le risque d’accident ; l’École n’assume aucune couverture accident pendant les formations.",
        ],
      },
      {
        heading: "Article 14 – Droit applicable et for",
        paragraphs: [
          `Le contrat est régi par le droit suisse. Tout litige relève de la compétence exclusive des tribunaux ordinaires de ${organization.court.fr}, sous réserve des fors impératifs applicables aux consommatrices et consommateurs.`,
        ],
      },
    ],
    de: [
      {
        heading: "Artikel 1 – Gegenstand",
        paragraphs: [
          `Diese Anmeldebedingungen (CGI) gelten zwischen ${organization.legalName}, Sitz ${registered} (nachfolgend «die Schule»), und jeder Person, die eine Ausbildung, einen Workshop oder ein Seminar auf mhp-coaching bucht (nachfolgend «Teilnehmer»).`,
          "Mit dem Absenden des Anmeldeformulars akzeptiert der Teilnehmer diese Bedingungen ohne Vorbehalt. Personenbezeichnungen gelten für alle Geschlechter.",
        ],
      },
      {
        heading: "Artikel 2 – Preise",
        paragraphs: [
          "Preise sind in Schweizer Franken (CHF) angegeben, inklusive Steuern am Tag der Anmeldung. Die Online-Zahlung erfolgt in CHF. Die Schule kann Preise jederzeit ändern; massgebend ist der bei der Anmeldung veröffentlichte Tarif.",
          "Verrechnet wird der veröffentlichte Kurspreis, niemals ein im Browser eingegebener Betrag.",
        ],
      },
      {
        heading: "Artikel 3 – Anmeldung",
        paragraphs: [
          "Die Anmeldung erfolgt online auf mhp-coaching für eine datierte Session. Ein Kurs ohne veröffentlichtes Datum kann nicht gekauft werden; eine Warteliste kann angeboten werden. Die Warteliste reserviert keinen Platz und begründet keine Zahlungspflicht.",
        ],
        items: [
          "Das Absenden des Formulars erzeugt eine ausstehende Buchung. Als bezahlt gilt sie erst nach erfolgreicher, vom Anbieter bestätigter Zahlung. Das Öffnen der Erfolgsseite reicht nicht.",
          "Plätze sind begrenzt, solange die Session auf der Website steht.",
          "Ist die Session voll, kann der Teilnehmer auf die Warteliste. Bei einem Rücktritt oder freien Platz erfolgt eine E-Mail.",
        ],
      },
      {
        heading: "Artikel 4 – Zulassung",
        paragraphs: [
          "Der Teilnehmer muss die auf der Kursseite genannten Voraussetzungen erfüllen und diese vor der Anmeldung selbst prüfen. Die Schule kann eine Anmeldung ganz oder teilweise annehmen oder ablehnen.",
          `Äquivalenzgesuche sind vor der Anmeldung an ${organization.email} zu richten.`,
        ],
      },
      {
        heading: "Artikel 5 – Zahlung",
        paragraphs: [
          "Vertragliches Widerrufsrecht: 10 Tage ab Anmeldedatum, solange der Kurs nicht begonnen hat. In dieser Frist kann der Teilnehmer schriftlich an " +
            organization.email +
            " zurücktreten. Gezahlte Beträge werden erstattet. Eine Rückerstattung auf das ursprüngliche Zahlungsmittel kann die in Artikel 6 genannten Transaktions- und Verwaltungskosten (5 % des Kurspreises) auslösen; eine Gutschrift für einen späteren Kurs ist ohne diese Kosten möglich.",
          "Bei Kursen mit festem Termin gilt das europäische 14-tägige Widerrufsrecht für bestimmte Fernabsatzverträge in der Regel nicht mehr, sobald die Session gewählt ist. Die vertraglichen 10 Tage bleiben von der Schule gewährt.",
        ],
        items: [
          "Online-Zahlung: TWINT (nur CHF), Visa oder Mastercard über Stripe. Die Zahlung ist bei Online-Checkout fällig.",
          "Anderes Zahlungsmittel: über das vorgesehene Formular. Es kann eine Rechnung ausgestellt werden. Zahlungsfrist 30 Tage, ausser beim OMNI-Hypnose-Praktiker, der vor dem ersten Kurstag vollständig bezahlt sein muss.",
          "Ratenzahlung: auf Anfrage ohne Aufpreis. 30 % Anzahlung; der Rest nach Vereinbarung mit der Schule.",
        ],
      },
      {
        heading: "Artikel 6 – Verschiebung, Storno oder Abbruch",
        paragraphs: [
          `Anträge auf Verschiebung oder Storno nach Ablauf von Artikel 5 erfolgen schriftlich an ${organization.email} oder über das Kontaktformular.`,
        ],
        items: [
          "Mehr als 7 volle Tage vor Kursbeginn: kostenlose Verschiebung. Der bezahlte Betrag wird als Guthaben für einen späteren Kurs gutgeschrieben.",
          "Weniger als 7 volle Tage vor Beginn: 30 % des Kurspreises bleiben geschuldet. Der Rest wird als Guthaben gutgeschrieben.",
          "Unangekündigtes Fernbleiben: der volle Preis bleibt geschuldet.",
          "Höhere Gewalt des Teilnehmers mit Nachweis: kostenlose Verschiebung.",
          "Auszahlung eines Guthabens: auf Anfrage, mit Transaktions- und Verwaltungskosten von 5 % des Kurspreises.",
          "Nichtzahlung gilt nicht als Rücktritt von der Anmeldung.",
        ],
      },
      {
        heading: "Artikel 7 – Absage durch die Schule",
        paragraphs: [
          "Die Schule kann einen Kurs bis 7 Tage vor dem geplanten Termin absagen. Gezahlte Beträge werden vollständig erstattet, oder der Teilnehmer kann auf eine gleichwertige Session umbuchen, soweit Plätze frei sind.",
          "Bei höherer Gewalt werden Sessions ohne Rückerstattung verschoben; der Teilnehmer wählt unter den Ersatzterminen. Die Schule kann das Format (Präsenz / Distanz) ohne Rückerstattungspflicht anpassen.",
        ],
      },
      {
        heading: "Artikel 8 – Zertifizierung",
        paragraphs: [
          "Ein Zertifikat wird nur erteilt, wenn der Kurs vollständig besucht wurde, vorbehältlich der auf der Kursseite beschriebenen Modalitäten.",
          "Für den OMNI-Hypnose-Praktiker sind das theoretische und das praktische Examen erforderlich. Bei Nichtbestehen können Prüfungen wiederholt werden; Zusatzkosten können anfallen.",
          "Für Weiterbildungen ist die Anwesenheit während der gesamten Session Voraussetzung für die Zertifizierung.",
          "Für die Master-Praktiker-Abschlussprüfung ist die Validierung der Arbeit (Bericht und Präsentation) erforderlich. Ein Nichtbestehen kann nachgeholt werden; Zusatzkosten können anfallen.",
        ],
      },
      {
        heading: "Artikel 9 – Geistiges Eigentum",
        paragraphs: [
          "Soweit nicht anders angegeben, steht das von der Schule erstellte Unterrichtsmaterial unter der Creative-Commons-Lizenz Attribution 4.0 International (CC BY 4.0). Teilen und Anpassen, auch kommerziell, sind erlaubt, sofern die Quelle genannt, die Lizenz angegeben und Änderungen kenntlich gemacht werden. Einzelheiten stehen auf der Urheberrechtsseite.",
          "Das Material des OMNI-Hypnose-Praktikers ist geistiges Eigentum von OMNI Hypnosis Training Center International (Hypnose.net GmbH); die Schule hält die Urheberrechte an den französischen Übersetzungen. Dieses Material darf nicht zur Weitergabe an Dritte vervielfältigt werden. Eine gesonderte Urheberrechtsvereinbarung kann unterzeichnet werden müssen.",
        ],
      },
      {
        heading: "Artikel 10 – Vertraulichkeit im Kurs",
        paragraphs: [
          "Alles, was im Kurs gesagt oder ausgetauscht wird, ist vertraulich. Aufnahmen, Fotos oder Filme von Inhalten, Austauschen oder Demonstrationen sind ohne vorherige schriftliche Erlaubnis der Schule untersagt.",
          "Ein Verstoss kann den sofortigen Ausschluss ohne Rückerstattung und gegebenenfalls rechtliche Schritte nach sich ziehen.",
        ],
      },
      {
        heading: "Artikel 11 – Sessioninformationen",
        paragraphs: [
          "Ort, Dozent, Zeiten und weitere Angaben stehen auf der Kursseite und werden per E-Mail bestätigt. Sie können sich bis zur Einladung noch ändern. Wesentliche Änderungen nach Bestätigung werden per E-Mail mitgeteilt.",
        ],
      },
      {
        heading: "Artikel 12 – Bildrecht",
        paragraphs: [
          "Mit der Teilnahme erklärt sich der Teilnehmer einverstanden, dass Bild- oder Videoaufnahmen zu pädagogischen, werblichen oder Kommunikationszwecken gemacht werden können, soweit angemessen anonymisiert. Aufnahmen werden nicht an Dritte verkauft und nicht ohne ausdrückliche Zustimmung anderweitig kommerziell genutzt.",
          `Ein Widerspruch gegen die Bildnutzung kann jederzeit schriftlich an ${organization.email} erklärt werden, vor dem Kurs oder zum Zeitpunkt der Aufnahme.`,
        ],
      },
      {
        heading: "Artikel 13 – Haftung",
        paragraphs: [
          "Die Schule haftet nicht für indirekte Schäden (entgangener Gewinn, Umsatz- oder Betriebsausfall, Datenverlust, Aufwendungen des Teilnehmers) im Zusammenhang mit den Leistungen, auch wenn sie auf die Möglichkeit hingewiesen wurde.",
          "Für Verlust oder Diebstahl persönlicher Gegenstände wird nicht gehaftet. Die Teilnehmer tragen das Unfallrisiko selbst; die Schule bietet keinen Unfallversicherungsschutz während der Kurse.",
        ],
      },
      {
        heading: "Artikel 14 – Anwendbares Recht und Gerichtsstand",
        paragraphs: [
          `Es gilt schweizerisches Recht. Ausschliesslicher Gerichtsstand sind die ordentlichen Gerichte von ${organization.court.de}, vorbehaltlich zwingender Verbrauchergerichtsstände.`,
        ],
      },
    ],
    en: [
      {
        heading: "Article 1 – Purpose",
        paragraphs: [
          `These booking terms (CGI) govern the contract between ${organization.legalName}, registered office ${registered} (the “School”), and anyone who books a course, workshop or seminar on mhp-coaching (the “Participant”).`,
          "Submitting the booking form constitutes full acceptance of these terms. Words referring to persons include every gender.",
        ],
      },
      {
        heading: "Article 2 – Prices",
        paragraphs: [
          "Prices are shown in Swiss francs (CHF), taxes included on the booking date. Online payment is in CHF. The School may change prices at any time; the published price at booking applies.",
          "The charged amount is the published course price, never an amount entered in the browser.",
        ],
      },
      {
        heading: "Article 3 – Booking",
        paragraphs: [
          "Bookings are made online on mhp-coaching for a dated session. A course with no published date cannot be purchased; a waiting list may be offered. Joining a waiting list does not reserve a place and creates no payment obligation.",
        ],
        items: [
          "Submitting the form creates a pending booking. It is marked paid only after successful payment confirmed by the provider. Opening the success page is not enough.",
          "Places are limited while the session remains listed on the site.",
          "If the session is full, the Participant may join the waiting list and will be emailed if a place opens.",
        ],
      },
      {
        heading: "Article 4 – Admission",
        paragraphs: [
          "The Participant must meet the prerequisites on the course page and is responsible for checking them before booking. The School may accept or refuse a booking in whole or in part.",
          `Equivalence requests must be sent to ${organization.email} before booking.`,
        ],
      },
      {
        heading: "Article 5 – Payment",
        paragraphs: [
          "Contractual cooling-off period: 10 days from the booking date, provided the course has not started. Within that period the Participant may withdraw in writing to " +
            organization.email +
            ". Amounts paid are then refunded. A refund to the original payment method may carry the transaction and administration fees in Article 6 (5% of the course price); a credit for a later course is available without those fees.",
          "For courses with a specific date, the EU 14-day withdrawal right for certain distance contracts generally does not apply once a session is chosen. The 10-day contractual period above is still granted by the School.",
        ],
        items: [
          "Online payment: TWINT (CHF only), Visa or Mastercard, via Stripe. Payment is due at online checkout.",
          "Another payment method: request it through the dedicated form. An invoice may be issued. Payment is due within 30 days, except for the OMNI Hypnosis Practitioner course, which must be paid in full before the first training day.",
          "Instalments: available on request at no extra charge. A 30% deposit is then due; the balance is agreed with the School.",
        ],
      },
      {
        heading: "Article 6 – Postponement, cancellation or withdrawal",
        paragraphs: [
          `After the Article 5 period, postponement or cancellation requests must be made in writing to ${organization.email} or via the contact form.`,
        ],
        items: [
          "More than 7 clear days before the course starts: postponement at no extra charge. Amounts paid are credited for a later course.",
          "Fewer than 7 clear days before the start: 30% of the course price remains due. The balance is credited.",
          "Unannounced absence: the full price remains due.",
          "Force majeure affecting the Participant, with evidence: postponement at no extra charge.",
          "Cashing out a credit: on request, with transaction and administration fees equal to 5% of the course price.",
          "Non-payment is not a withdrawal from the booking.",
        ],
      },
      {
        heading: "Article 7 – Cancellation by the School",
        paragraphs: [
          "The School may cancel a course up to 7 days before the scheduled date. Amounts paid are then refunded in full, or the Participant may join an equivalent session if places remain.",
          "In force majeure, sessions are postponed without refund; the Participant chooses among replacement dates. The School may also change the format (in person / remote) without a duty to refund.",
        ],
      },
      {
        heading: "Article 8 – Certification",
        paragraphs: [
          "Certification is issued only if the candidate completed the course in full, subject to the rules published on the course page.",
          "For the OMNI Hypnosis Practitioner course, both the theoretical and practical exams are required. Failed exams may be retaken; extra fees may apply.",
          "For continuing-education courses, attendance for the whole session is required for certification.",
          "For the Master Practitioner final exam, validation of the work (report and presentation) is required. Failure may be retaken; extra fees may apply.",
        ],
      },
      {
        heading: "Article 9 – Intellectual property",
        paragraphs: [
          "Unless stated otherwise, teaching materials created by the School are licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Sharing and adapting, including commercially, is allowed if you credit the work, name the licence and mark changes. Details are on the copyright page.",
          "OMNI Hypnosis Practitioner materials are the intellectual property of OMNI Hypnosis Training Center International (Hypnose.net GmbH); the School holds the copyright in the French translations. That material may not be reproduced for distribution to third parties. A separate copyright agreement may need to be signed.",
        ],
      },
      {
        heading: "Article 10 – Confidentiality in training",
        paragraphs: [
          "Everything said or exchanged in training is confidential. Participants may not record, photograph or film content, exchanges or demonstrations without the School’s prior written permission.",
          "A breach may lead to immediate exclusion without refund and, if needed, legal action.",
        ],
      },
      {
        heading: "Article 11 – Session information",
        paragraphs: [
          "Venue, trainer, timetable and other session details appear on the course page and are confirmed by email. They may still change until the joining instructions. Material changes after confirmation are emailed.",
        ],
      },
      {
        heading: "Article 12 – Image rights",
        paragraphs: [
          "By attending, the Participant agrees that their image may be captured (photos, video) for teaching, promotional or communication purposes, anonymised where appropriate. Captures are not sold to third parties or used for other commercial purposes without explicit consent.",
          `Objection to use of an image may be notified in writing to ${organization.email} at any time, before the course or at the time of capture.`,
        ],
      },
      {
        heading: "Article 13 – Liability",
        paragraphs: [
          "The School is not liable for indirect damage (loss of profit, revenue, business or data, or Participant expenses) arising from the services, even if it was told such damage was possible.",
          "The School is not liable for loss or theft of personal belongings. Participants carry their own accident risk; the School provides no accident cover during courses.",
        ],
      },
      {
        heading: "Article 14 – Governing law and venue",
        paragraphs: [
          `The contract is governed by Swiss law. Exclusive jurisdiction lies with the ordinary courts of ${organization.court.en}, subject to any mandatory consumer venues.`,
        ],
      },
    ],
  },
} as const satisfies LegalDoc;
