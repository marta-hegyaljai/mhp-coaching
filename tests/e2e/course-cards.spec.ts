import {expect, test} from "@playwright/test";

const omniCard = {
  path: "/fr/formations",
  title: "Praticien·ne en Hypnose OMNI®",
} as const;

const multiDateCourses = [
  {
    path: "/fr/formations",
    title: "Praticien·ne en Hypnose OMNI®",
    months: ["septembre", "octobre", "novembre"],
  },
  {
    path: "/de/ausbildungen",
    title: "OMNI® Hypnosepraktiker·in",
    months: ["September", "Oktober", "November"],
  },
  {
    path: "/en/courses",
    title: "OMNI® Hypnosis Practitioner",
    months: ["September", "October", "November"],
  },
] as const;

const cardWidths = [
  {width: 1280, height: 900},
  {width: 820, height: 1180},
  {width: 390, height: 844},
];

test.describe("course cards", () => {
  for (const {path, title, months} of multiDateCourses) {
    test(`${path} lists every upcoming date on the card`, async ({page}) => {
      await page.goto(path);

      const card = page.locator("article").filter({hasText: title}).first();
      const monthCells = card.locator("[data-date-part=month]");

      await expect(monthCells).toHaveCount(months.length);
      await expect(monthCells).toHaveText([...months]);
    });
  }

  test("the catalogue price sits on the closing row", async ({page}) => {
    await page.goto(omniCard.path);

    const card = page.locator("article").filter({hasText: omniCard.title}).first();
    const title = card.getByRole("heading", {name: omniCard.title});
    const price = card.getByText(/3’490/);
    const action = card.getByText(/Détail de la formation/i);

    const [titleBox, priceBox, actionBox] = await Promise.all([
      title.boundingBox(),
      price.boundingBox(),
      action.boundingBox(),
    ]);

    expect(titleBox).not.toBeNull();
    expect(priceBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    expect(priceBox!.y).toBeGreaterThan(titleBox!.y + (titleBox!.height ?? 0));
    expect(Math.abs(priceBox!.y - actionBox!.y)).toBeLessThanOrEqual(6);
    expect(priceBox!.x).toBeGreaterThan(actionBox!.x);
  });

  test("a single-date course keeps one date line", async ({page}) => {
    await page.goto("/fr/formations");

    const card = page.locator("article").filter({hasText: "Sport & Hypnose"}).first();

    await expect(card.locator("[data-date-part=days]")).toHaveCount(1);
  });

  for (const viewport of cardWidths) {
    test(`stacked dates share month and year columns at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(omniCard.path);

      const card = page.locator("article").filter({hasText: omniCard.title}).first();
      const months = card.locator("[data-date-part=month]");
      const years = card.locator("[data-date-part=year]");
      const location = card.getByText("Fribourg").first();

      const [monthBoxes, yearBoxes, locationBox] = await Promise.all([
        months.all().then((nodes) => Promise.all(nodes.map((node) => node.boundingBox()))),
        years.all().then((nodes) => Promise.all(nodes.map((node) => node.boundingBox()))),
        location.boundingBox(),
      ]);

      expect(monthBoxes).toHaveLength(3);
      expect(yearBoxes).toHaveLength(3);
      expect(locationBox).not.toBeNull();

      const monthX = monthBoxes[0]?.x ?? -1;
      const yearX = yearBoxes[0]?.x ?? -1;
      for (const box of monthBoxes) {
        expect(box).not.toBeNull();
        expect(Math.abs(box!.x - monthX)).toBeLessThanOrEqual(1);
      }
      for (const box of yearBoxes) {
        expect(box).not.toBeNull();
        expect(Math.abs(box!.x - yearX)).toBeLessThanOrEqual(1);
      }
      expect(Math.abs((monthBoxes[0]?.y ?? 0) - locationBox!.y)).toBeLessThanOrEqual(2);
      expect((monthBoxes[2]?.y ?? 0) - (monthBoxes[0]?.y ?? 0)).toBeLessThanOrEqual(52);
    });
  }
});
