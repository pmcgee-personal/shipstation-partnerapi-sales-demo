// src/utils/demoUtils.js

export const generateDemoDetails = () => {
  const companyNouns = [
    "Goods",
    "Supply",
    "Logistics",
    "Outfitters",
    "Imports",
    "Wares",
  ];
  const companyAdjectives = [
    "Apex",
    "Riverside",
    "Summit",
    "Coastal",
    "Pinnacle",
    "Nova",
  ];

  const randomAdjective =
    companyAdjectives[Math.floor(Math.random() * companyAdjectives.length)];
  const randomNoun =
    companyNouns[Math.floor(Math.random() * companyNouns.length)];
  const timestamp = Date.now().toString().slice(-5); // Unique suffix

  const label = `${randomAdjective} ${randomNoun}`;
  const email = `demo-${randomAdjective.toLowerCase()}-${timestamp}@example.com`;

  return { label, email };
};
