const { getLiveUnassignedRides } = require('./src/services/ride/expiry.service');

async function main() {
  const res = await getLiveUnassignedRides();
  console.log(JSON.stringify(res, null, 2));
}

main().finally(() => process.exit(0));
