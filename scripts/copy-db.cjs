// Copies every row from the OLD database to the NEW database.
// Usage: set OLD_URL and NEW_URL (direct connection strings), then run:
//   node scripts/copy-db.cjs
const { PrismaClient, Prisma } = require("@prisma/client");

const oldUrl = process.env.OLD_URL;
const newUrl = process.env.NEW_URL;

if (!oldUrl || !newUrl) {
  console.error("Set OLD_URL and NEW_URL first.");
  process.exit(1);
}
if (oldUrl === newUrl) {
  console.error("OLD_URL and NEW_URL are the same. Stopping to protect your data.");
  process.exit(1);
}

const from = new PrismaClient({ datasourceUrl: oldUrl });
const to = new PrismaClient({ datasourceUrl: newUrl });

const jsonOrNull = (v) => (v === null ? Prisma.DbNull : v);

async function insertInBatches(label, rows, insert, size) {
  for (let i = 0; i < rows.length; i += size) {
    await insert(rows.slice(i, i + size));
    console.log(`  ${label}: ${Math.min(i + size, rows.length)} of ${rows.length}`);
  }
  if (rows.length === 0) console.log(`  ${label}: nothing to copy`);
}

async function main() {
  console.log("Reading from the old database...");

  const users = await from.user.findMany();
  await insertInBatches("users", users, (data) =>
    to.user.createMany({ data, skipDuplicates: true }), 50);

  const projects = await from.project.findMany();
  await insertInBatches(
    "projects",
    projects.map((p) => ({
      ...p,
      requirements: jsonOrNull(p.requirements),
      architecture: jsonOrNull(p.architecture),
    })),
    (data) => to.project.createMany({ data, skipDuplicates: true }),
    20
  );

  const files = await from.projectFile.findMany();
  await insertInBatches("files", files, (data) =>
    to.projectFile.createMany({ data, skipDuplicates: true }), 20);

  const versions = await from.projectVersion.findMany();
  await insertInBatches("versions", versions, (data) =>
    to.projectVersion.createMany({ data, skipDuplicates: true }), 5);

  const messages = await from.chatMessage.findMany();
  await insertInBatches("chat messages", messages, (data) =>
    to.chatMessage.createMany({ data, skipDuplicates: true }), 50);

  const memories = await from.projectMemory.findMany();
  await insertInBatches("memory notes", memories, (data) =>
    to.projectMemory.createMany({ data, skipDuplicates: true }), 50);

  const deployments = await from.deployment.findMany();
  await insertInBatches("deployments", deployments, (data) =>
    to.deployment.createMany({ data, skipDuplicates: true }), 50);

  console.log("\nVerifying (old -> new):");
  const models = [
    ["users", "user"],
    ["projects", "project"],
    ["files", "projectFile"],
    ["versions", "projectVersion"],
    ["chat messages", "chatMessage"],
    ["memory notes", "projectMemory"],
    ["deployments", "deployment"],
  ];
  let allMatch = true;
  for (const [label, model] of models) {
    const [a, b] = await Promise.all([from[model].count(), to[model].count()]);
    if (a !== b) allMatch = false;
    console.log(`  ${label}: ${a} -> ${b}${a === b ? "  OK" : "  MISMATCH"}`);
  }
  console.log(allMatch ? "\nCopy complete. All counts match." : "\nSome counts differ. Run the script again.");
}

main()
  .catch((err) => {
    console.error("Copy failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await from.$disconnect();
    await to.$disconnect();
  });