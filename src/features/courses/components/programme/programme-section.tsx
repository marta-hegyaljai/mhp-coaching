import type {ProgrammeCardModel} from "./programme-card-model";
import {ProgrammeCard} from "./programme-card";

export type ProgrammeSectionLabels = {
  title: string;
  intro: string;
};

/**
 * Closes the catalogue with the bundled paths, after every individual module.
 * Renders nothing when no programme survives the active filters.
 */
export function ProgrammeSection({
  programmes,
  labels,
}: {
  programmes: ProgrammeCardModel[];
  labels: ProgrammeSectionLabels;
}) {
  if (programmes.length === 0) {
    return null;
  }

  return (
    <section className="mt-14 border-t-2 border-ink pt-8">
      <h2 className="font-serif text-subheading">{labels.title}</h2>
      <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">{labels.intro}</p>
      <div className="mt-6 grid gap-6">
        {programmes.map((programme) => (
          <ProgrammeCard key={programme.id} model={programme} />
        ))}
      </div>
    </section>
  );
}
