-- Magie, rire & Hypnose: published Atelier pratique with no sessions.
-- Staff add dates from the course record. Preview builds migrate but do not
-- re-seed, so this row must exist in SQL.

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
  'magic-laughter-hypnosis',
  $json${"fr":"magie-rire-hypnose","de":"magie-lachen-hypnose","en":"magic-laughter-hypnosis"}$json$::jsonb,
  $json${"fr":"Magie, rire & Hypnose","de":"Magie, Lachen & Hypnose","en":"Magic, Laughter & Hypnosis"}$json$::jsonb,
  $json${"fr":"Et si, pour accompagner les enfants, il fallait parfois redevenir un peu enfant soi-même ?","de":"Was wäre, wenn man, um Kinder zu begleiten, manchmal selbst wieder ein wenig Kind werden müsste?","en":"What if supporting children sometimes meant becoming a little child again yourself?"}$json$::jsonb,
  $json${"fr":"Les enfants adorent la magie. Et l’hypnose aussi… car elle ouvre naturellement la porte à l’imaginaire. Comme on le dit souvent : l’imagination prime sur la réalité. Un effet magique capte immédiatement l’attention, éveille la curiosité et facilite le lien thérapeutique. L’humour apporte cette légèreté précieuse qui détend l’atmosphère et aide les enfants — et parfois aussi les parents — à se sentir rapidement en confiance. Magie, humour et hypnose forment ainsi un trio puissant pour créer une relation, apaiser les peurs et entrer plus naturellement dans le monde de l’enfant. Lors de cette journée pratique, vous découvrirez comment utiliser des effets de magie simples et efficaces dans votre travail avec les enfants et vous repartirez avec des outils concrets, immédiatement utilisables en séance. Vous apprendrez à réaliser plusieurs tours de magie adaptés au contexte thérapeutique, à utiliser la surprise et l’humour pour créer rapidement le lien, et à intégrer ces approches naturellement dans vos séances. Aucune expérience en magie n’est nécessaire — l’objectif n’est pas de devenir magicien, mais d’avoir quelques outils puissants et ludiques pour enrichir votre pratique.","de":"Kinder lieben Magie. Und Hypnose ebenso … denn sie öffnet ganz natürlich die Tür zur Vorstellungskraft. Wie man oft sagt: Die Vorstellungskraft hat Vorrang vor der Realität. Ein magischer Effekt fesselt sofort die Aufmerksamkeit, weckt Neugier und erleichtert die therapeutische Beziehung. Humor bringt diese wertvolle Leichtigkeit, die die Atmosphäre entspannt und Kindern — und manchmal auch den Eltern — hilft, schnell Vertrauen zu fassen. Magie, Humor und Hypnose bilden so ein kraftvolles Trio, um eine Beziehung aufzubauen, Ängste zu beruhigen und natürlicher in die Welt des Kindes einzutreten. An diesem Praxistag entdecken Sie, wie Sie einfache und wirksame Magie-Effekte in der Arbeit mit Kindern einsetzen, und Sie gehen mit konkreten, sofort in der Sitzung nutzbaren Werkzeugen nach Hause. Sie lernen mehrere für den therapeutischen Kontext geeignete Zaubertricks, nutzen Überraschung und Humor, um rasch den Kontakt herzustellen, und integrieren diese Ansätze natürlich in Ihre Sitzungen. Magie-Erfahrung ist nicht nötig — das Ziel ist nicht, Zauberer zu werden, sondern einige kraftvolle, spielerische Werkzeuge zu haben, die Ihre Praxis bereichern.","en":"Children love magic. And hypnosis too… because it naturally opens the door to the imagination. As we often say: imagination takes precedence over reality. A magic effect immediately captures attention, awakens curiosity and eases the therapeutic bond. Humour brings that precious lightness that relaxes the atmosphere and helps children — and sometimes parents too — feel at ease quickly. Magic, humour and hypnosis thus form a powerful trio for building a relationship, easing fears and entering the child’s world more naturally. On this practical day, you will discover how to use simple, effective magic effects in your work with children and leave with concrete tools you can use immediately in session. You will learn several magic tricks suited to the therapeutic context, use surprise and humour to create connection quickly, and integrate these approaches naturally into your sessions. No magic experience is needed — the aim is not to become a magician, but to have a few powerful, playful tools that enrich your practice."}$json$::jsonb,
  $json${"fr":"Praticien·ne·s en hypnose ou en thérapie complémentaire travaillant — ou souhaitant travailler — avec des enfants et des adolescents, et désireux·ses d’enrichir leurs séances par des approches ludiques et créatives. Prérequis: Formation de base en hypnose (Praticien·ne OMNI® ou équivalent) ou autre approche de thérapie complémentaire.","de":"Praktiker·innen in Hypnose oder Komplementärtherapie, die mit Kindern und Jugendlichen arbeiten — oder dies möchten — und ihre Sitzungen mit spielerischen, kreativen Ansätzen bereichern wollen. Voraussetzung: Grundausbildung in Hypnose (OMNI®-Praktiker·in oder gleichwertig) oder ein anderer komplementärtherapeutischer Ansatz.","en":"Hypnosis or complementary-therapy practitioners who work — or wish to work — with children and adolescents, and who want to enrich their sessions with playful, creative approaches. Prerequisite: foundation training in hypnosis (OMNI® Practitioner or equivalent) or another complementary-therapy approach."}$json$::jsonb,
  $json${"fr":"1 jour · 8 heures · 9h00–18h00","de":"1 Tag · 8 Stunden · 9:00–18:00","en":"1 day · 8 hours · 9:00–18:00"}$json$::jsonb,
  $json${"fr":"Fribourg","de":"Freiburg","en":"Fribourg"}$json$::jsonb,
  300,
  'workshop',
  'module',
  true,
  19
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "courses" SET "display_order" = 20, "updated_at" = now()
WHERE "id" = 'cafe-supervision' AND "display_order" = 19;
--> statement-breakpoint
UPDATE "courses" SET "display_order" = 21, "updated_at" = now()
WHERE "id" = 'stripe-payment-test' AND "display_order" = 20;
--> statement-breakpoint
UPDATE "courses" SET "display_order" = 22, "updated_at" = now()
WHERE "id" = 'master-practitioner' AND "display_order" = 21;
