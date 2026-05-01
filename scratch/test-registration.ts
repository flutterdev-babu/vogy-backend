import { registerPartner } from "../src/services/auth/partner.auth.service";
import { registerVendor } from "../src/services/auth/vendor.auth.service";
import { registerAgent } from "../src/services/auth/agent.auth.service";

async function run() {
  const cityCodeId = "6996ffbbd1e9c000a1297434";
  try {
    console.log("Testing Partner Register...");
    await registerPartner({
      firstName: "Test",
      lastName: "Partner",
      phone: "+919999999999",
      password: "password123",
      hasLicense: true,
      licenseNumber: "LIC123",
      licenseImage: "http://image.com",
      cityCodeId
    });
    console.log("Partner registration successful");
  } catch (err: any) {
    console.error("Partner Error:", err.message);
  }

  try {
    console.log("Testing Vendor Register...");
    await registerVendor({
      name: "Test",
      companyName: "Test Co",
      phone: "+919999999998",
      password: "password123",
      cityCodeId
    });
    console.log("Vendor registration successful");
  } catch (err: any) {
    console.error("Vendor Error:", err.message);
  }

  try {
    console.log("Testing Agent Register...");
    await registerAgent({
      name: "Test Agent",
      phone: "+919999999997",
      password: "password123",
      cityCodeId
    });
    console.log("Agent registration successful");
  } catch (err: any) {
    console.error("Agent Error:", err.message);
  }
}

run();
