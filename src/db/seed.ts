async function seed() {
  console.log("No seed data is required for the bootstrap foundation.");
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
