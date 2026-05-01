import { loginPartner } from "../src/services/auth/partner.auth.service";
import { loginVendor } from "../src/services/auth/vendor.auth.service";
import { loginAgent } from "../src/services/auth/agent.auth.service";

async function run() {
  try {
    console.log("Testing Partner Login...");
    const res = await loginPartner("+919999999999", "password123");
    console.log("Partner login successful", res.partner.id);
  } catch (err: any) {
    console.error("Partner Login Error:", err.message);
  }

  try {
    console.log("Testing Vendor Login...");
    const res = await loginVendor("+919999999998", "password123");
    console.log("Vendor login successful", res.vendor.id);
  } catch (err: any) {
    console.error("Vendor Login Error:", err.message);
  }

  try {
    console.log("Testing Agent Login...");
    // We didn't register agent because of the error, so this will fail with 'Invalid phone or password'
    const res = await loginAgent("+919999999997", "password123");
    console.log("Agent login successful", res.agent.id);
  } catch (err: any) {
    console.error("Agent Login Error:", err.message);
  }
}

run();
