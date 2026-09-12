type Person = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

/** Full name when we have one, otherwise the address the account signs in with. */
export function displayName(person: Person): string {
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || (person.email ?? "").trim();
}

/**
 * Monogram for the account control. Falls back through last name, email and a
 * neutral mark so a partially filled profile never renders an empty tile.
 */
export function personInitials(person: Person): string {
  const monogram = `${firstCharacter(person.firstName)}${firstCharacter(person.lastName)}`;

  return monogram || firstCharacter(person.email) || "•";
}

function firstCharacter(value: string | null | undefined): string {
  // Iterate code points so accented or non-Latin names are not split.
  const [character] = [...(value ?? "").trim()];
  return character ? character.toLocaleUpperCase() : "";
}
