import { defineRailway, project, service } from "railway/iac";

// Last resort for a per-service CaC repo. Prefer one .railway file for the
// project and drop this if you later combine services into that file.
export const partial = "restaurant-billing";

export default defineRailway(() => {
  const restaurant_billing = service("restaurant-billing", {
    build: "npm install && npm run build",
    start: "node server/index.js",
    // builder from CaC: "NIXPACKS"
  });
  return project("lucid-endurance", {
    resources: [restaurant_billing],
  });
});
