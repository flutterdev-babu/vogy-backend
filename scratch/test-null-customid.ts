import { registerPartner } from "../src/services/auth/partner.auth.service";
import { registerVendor } from "../src/services/auth/vendor.auth.service";

async function run() {
  try {
    console.log("Testing Partner Register without cityCodeId...");
    await registerPartner({
      firstName: "Test2",
      lastName: "Partner",
      phone: "+919999999991",
      password: "password123",
      hasLicense: true,
      licenseNumber: "LIC1234",
      licenseImage: "http://image.com"
    });
    console.log("Partner registration 1 successful");

    await registerPartner({
      firstName: "Test3",
      lastName: "Partner",
      phone: "+919999999992",
      password: "password123",
      hasLicense: true,
      licenseNumber: "LIC1235",
      licenseImage: "http://image.com"
    });
    console.log("Partner registration 2 successful");
  } catch (err: any) {
    console.error("Partner Error:", err.message);
  }

  try {
    console.log("Testing Vendor Register without cityCodeId...");
    await registerVendor({
      name: "Test2",
      companyName: "Test Co2",
      phone: "+919999999993",
      password: "password123",
    });
    console.log("Vendor registration 1 successful");

    await registerVendor({
      name: "Test3",
      companyName: "Test Co3",
      phone: "+919999999994",
      password: "password123",
    });
    console.log("Vendor registration 2 successful");
  } catch (err: any) {
    console.error("Vendor Error:", err.message);
  }
}

run();
