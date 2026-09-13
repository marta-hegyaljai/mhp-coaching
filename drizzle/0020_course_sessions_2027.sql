-- 2027 dates from docs/MHP_Hypnose_Jahreskalender_2027.csv, Typ = Kurs only.
-- Skipped: Sperrtermin, Pause, Prüfung (Examen Final), Planung offen (Maître Praticien).
-- CSV titles are French; they map onto existing course ids. "Hypnose médicale"
-- is not split into M1/M2/M3 in the calendar, so both April blocks land on
-- medical-hypnosis-m1 for staff to re-home if needed.
-- Inserted inactive so the public catalogue stays unchanged until admin finalizes.

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
)
SELECT
  v."id",
  v."course_id",
  v."start_date",
  v."end_date",
  $json${"fr":"Fribourg","de":"Freiburg","en":"Fribourg"}$json$::jsonb,
  NULL,
  16,
  false,
  COALESCE(existing.max_order, -1) + v."ord"
FROM (
  VALUES
    -- Zyklus I
    ('omni-practitioner-2027-01-21', 'omni-practitioner', '2027-01-21', '2027-01-24', 1),
    ('omni-practitioner-2027-01-29', 'omni-practitioner', '2027-01-29', '2027-01-31', 2),
    ('advanced-techniques-2027-02-12', 'advanced-techniques', '2027-02-12', '2027-02-14', 1),
    ('solution-focused-interview-2027-02-27', 'solution-focused-interview', '2027-02-27', '2027-02-28', 1),
    ('anxiety-hypnosis-2027-03-12', 'anxiety-hypnosis', '2027-03-12', '2027-03-14', 1),
    ('medical-hypnosis-m1-2027-04-02', 'medical-hypnosis-m1', '2027-04-02', '2027-04-04', 1),
    ('children-hypnosis-2027-04-10', 'children-hypnosis', '2027-04-10', '2027-04-11', 1),
    ('addictions-hypnosis-2027-04-17', 'addictions-hypnosis', '2027-04-17', '2027-04-18', 1),
    ('medical-hypnosis-m1-2027-04-26', 'medical-hypnosis-m1', '2027-04-26', '2027-04-29', 2),
    ('sport-hypnosis-2027-05-28', 'sport-hypnosis', '2027-05-28', '2027-05-29', 1),
    ('illness-hypnosis-2027-06-19', 'illness-hypnosis', '2027-06-19', '2027-06-20', 1),
    -- Zyklus II
    ('omni-practitioner-2027-08-26', 'omni-practitioner', '2027-08-26', '2027-08-29', 3),
    ('omni-practitioner-2027-09-03', 'omni-practitioner', '2027-09-03', '2027-09-05', 4),
    ('advanced-techniques-2027-09-17', 'advanced-techniques', '2027-09-17', '2027-09-19', 2),
    ('solution-focused-interview-2027-10-02', 'solution-focused-interview', '2027-10-02', '2027-10-03', 2),
    ('anxiety-hypnosis-2027-10-15', 'anxiety-hypnosis', '2027-10-15', '2027-10-17', 2),
    ('addictions-hypnosis-2027-11-06', 'addictions-hypnosis', '2027-11-06', '2027-11-07', 2),
    ('children-hypnosis-2027-11-13', 'children-hypnosis', '2027-11-13', '2027-11-14', 2),
    ('illness-hypnosis-2027-11-19', 'illness-hypnosis', '2027-11-19', '2027-11-20', 2),
    ('sport-hypnosis-2027-12-04', 'sport-hypnosis', '2027-12-04', '2027-12-05', 2)
) AS v("id", "course_id", "start_date", "end_date", "ord")
LEFT JOIN LATERAL (
  SELECT MAX(s."display_order") AS max_order
  FROM "course_sessions" s
  WHERE s."course_id" = v."course_id"
) existing ON true
WHERE EXISTS (SELECT 1 FROM "courses" c WHERE c."id" = v."course_id")
  AND NOT EXISTS (
    SELECT 1
    FROM "course_sessions" s
    WHERE s."course_id" = v."course_id"
      AND s."start_date" = v."start_date"
  )
ON CONFLICT ("id") DO NOTHING;
