-- Café Supervision course and individually bookable visio evenings. Staff can
-- publish or retire each date from the course record. Preview builds migrate
-- but do not re-seed, so these rows must exist in SQL.

INSERT INTO "courses" (
  "id",
  "slug",
  "title",
  "short_description",
  "description",
  "audience",
  "duration",
  "location",
  "price_chf",
  "category",
  "format",
  "published",
  "display_order"
) VALUES (
  'cafe-supervision',
  $json${"fr":"cafe-supervision","de":"supervisions-cafe","en":"cafe-supervision-group"}$json$::jsonb,
  $json${"fr":"Café Supervision","de":"Café Supervision","en":"Café Supervision"}$json$::jsonb,
  $json${"fr":"Supervision de groupe en visioconférence pour praticien·ne·s : échanger sur la pratique, prendre du recul et rester en lien avec ses pairs.","de":"Gruppensupervision per Videokonferenz für Praktiker·innen: Praxis austauschen, Distanz gewinnen und mit Kolleg·innen in Verbindung bleiben.","en":"Group supervision by videoconference for practitioners: exchange on practice, step back, and stay in contact with peers."}$json$::jsonb,
  $json${"fr":"Les cafés supervision sont des espaces de parole libre et bienveillante, conçus pour les hypnothérapeutes en formation ou en activité. Il s’agit de supervisions de groupe, distinctes des modules de formation, animées par l’équipe pédagogique dans un cadre confidentiel. Chaque date se réserve séparément.","de":"Die Cafés Supervision sind ein freier, wohlwollender Gesprächsraum für Hypnosetherapeut·innen in Ausbildung oder Praxis. Es handelt sich um Gruppensupervision — keine Standard-Ausbildungsmodule — geleitet vom Lehrteam in einem vertraulichen Rahmen. Jeder Termin wird einzeln gebucht.","en":"Café Supervision sessions are open, supportive spaces for hypnotherapists in training or in practice. They are group supervision, not standard training modules, hosted by the teaching team in a confidential setting. Each date is booked separately."}$json$::jsonb,
  $json${"fr":"Réservé aux élèves MHP Coaching ayant complété une formation de base : Praticien·ne en Hypnose OMNI et/ou Praticien·ne en Hypnose Médicale.","de":"Nur für MHP-Coaching-Absolvent·innen mit abgeschlossener Grundausbildung: OMNI®-Hypnosepraktiker·in und/oder Praktiker·in in medizinischer Hypnose.","en":"Reserved for MHP Coaching students who have completed a foundation course: OMNI® Hypnosis Practitioner and/or Medical Hypnosis Practitioner."}$json$::jsonb,
  $json${"fr":"2 heures · 18h–20h","de":"2 Stunden · 18–20 Uhr","en":"2 hours · 18:00–20:00"}$json$::jsonb,
  $json${"fr":"Visioconférence","de":"Videokonferenz","en":"Videoconference"}$json$::jsonb,
  0,
  'supervision',
  'module',
  true,
  19
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "courses" SET "display_order" = 20, "updated_at" = now()
WHERE "id" = 'stripe-payment-test' AND "display_order" = 19;
--> statement-breakpoint
UPDATE "courses" SET "display_order" = 21, "updated_at" = now()
WHERE "id" = 'master-practitioner' AND "display_order" = 20;
--> statement-breakpoint
INSERT INTO "course_sessions" (
  "id",
  "course_id",
  "start_date",
  "end_date",
  "location",
  "venue",
  "capacity",
  "active",
  "display_order"
) VALUES
  ('cafe-supervision-2026-10-06', 'cafe-supervision', '2026-10-06', NULL, $json${"fr":"Visioconférence","de":"Videokonferenz","en":"Videoconference"}$json$::jsonb, NULL, 10, true, 0),
  ('cafe-supervision-2026-10-20', 'cafe-supervision', '2026-10-20', NULL, $json${"fr":"Visioconférence","de":"Videokonferenz","en":"Videoconference"}$json$::jsonb, NULL, 10, true, 1),
  ('cafe-supervision-2026-11-03', 'cafe-supervision', '2026-11-03', NULL, $json${"fr":"Visioconférence","de":"Videokonferenz","en":"Videoconference"}$json$::jsonb, NULL, 10, true, 2),
  ('cafe-supervision-2026-11-17', 'cafe-supervision', '2026-11-17', NULL, $json${"fr":"Visioconférence","de":"Videokonferenz","en":"Videoconference"}$json$::jsonb, NULL, 10, true, 3),
  ('cafe-supervision-2026-12-01', 'cafe-supervision', '2026-12-01', NULL, $json${"fr":"Visioconférence","de":"Videokonferenz","en":"Videoconference"}$json$::jsonb, NULL, 10, true, 4),
  ('cafe-supervision-2026-12-15', 'cafe-supervision', '2026-12-15', NULL, $json${"fr":"Visioconférence","de":"Videokonferenz","en":"Videoconference"}$json$::jsonb, NULL, 10, true, 5)
ON CONFLICT ("id") DO NOTHING;
