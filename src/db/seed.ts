async function seed() {
  console.log("Course dates live in source-controlled catalogue config; no database seed is required.");
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
