import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Klienci
  const jan = await prisma.customer.create({
    data: {
      name: "Jan Kowalski",
      email: "jan.kowalski@email.pl",
      phone: "501-234-567",
      bikes: {
        create: [
          { brand: "Trek", model: "Marlin 7", year: 2022, type: "MTB" },
          { brand: "Giant", model: "Defy Advanced", year: 2021, type: "szosa" },
        ],
      },
    },
    include: { bikes: true },
  });

  const anna = await prisma.customer.create({
    data: {
      name: "Anna Nowak",
      email: "anna.nowak@email.pl",
      phone: "502-345-678",
      bikes: {
        create: [
          { brand: "Kross", model: "Level 5.0", year: 2023, type: "MTB" },
        ],
      },
    },
    include: { bikes: true },
  });

  const piotr = await prisma.customer.create({
    data: {
      name: "Piotr Wiśniewski",
      email: "piotr.w@email.pl",
      phone: "503-456-789",
      bikes: {
        create: [
          { brand: "Merida", model: "Silex 400", year: 2023, type: "gravel" },
          { brand: "Romet", model: "Wagant 1", year: 2020, type: "miejski" },
        ],
      },
    },
    include: { bikes: true },
  });

  // Części
  const parts = await Promise.all([
    prisma.part.create({
      data: {
        name: "Klocki hamulcowe Shimano B01S",
        category: "hamulce",
        brand: "Shimano",
        sku: "SHM-B01S",
        defaultPrice: 35.0,
        inventory: { create: { quantity: 8, minStock: 4, location: "A1" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Linka hamulcowa",
        category: "hamulce",
        brand: "Shimano",
        sku: "SHM-LNK-H",
        defaultPrice: 15.0,
        inventory: { create: { quantity: 12, minStock: 5, location: "A2" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Linka przerzutki",
        category: "napęd",
        brand: "Shimano",
        sku: "SHM-LNK-P",
        defaultPrice: 12.0,
        inventory: { create: { quantity: 10, minStock: 5, location: "A2" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Łańcuch Shimano HG71 8rz",
        category: "napęd",
        brand: "Shimano",
        sku: "SHM-HG71",
        defaultPrice: 55.0,
        inventory: { create: { quantity: 4, minStock: 2, location: "B1" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Kaseta Shimano HG200 8rz 12-32T",
        category: "napęd",
        brand: "Shimano",
        sku: "SHM-HG200",
        defaultPrice: 85.0,
        inventory: { create: { quantity: 3, minStock: 2, location: "B2" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Dętka 29 cali",
        category: "koła",
        brand: "Continental",
        sku: "CON-TUBE29",
        defaultPrice: 25.0,
        inventory: { create: { quantity: 15, minStock: 6, location: "C1" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Opona Schwalbe Marathon 28x1.75",
        category: "koła",
        brand: "Schwalbe",
        sku: "SCH-MAR28",
        defaultPrice: 95.0,
        inventory: { create: { quantity: 2, minStock: 2, location: "C2" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Taśma na obręcz 29 cali",
        category: "koła",
        brand: null,
        sku: "GEN-TAPE29",
        defaultPrice: 8.0,
        inventory: { create: { quantity: 6, minStock: 3, location: "C3" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Klocki hamulcowe Shimano M06",
        category: "hamulce",
        brand: "Shimano",
        sku: "SHM-M06",
        defaultPrice: 45.0,
        inventory: { create: { quantity: 1, minStock: 2, location: "A1" } },
      },
    }),
    prisma.part.create({
      data: {
        name: "Tarcza hamulcowa 160mm",
        category: "hamulce",
        brand: "Shimano",
        sku: "SHM-RT26-160",
        defaultPrice: 45.0,
        inventory: { create: { quantity: 3, minStock: 2, location: "A3" } },
      },
    }),
  ]);

  // Dostawcy
  const kolarz = await prisma.supplier.create({
    data: {
      name: "Kolarz",
      url: "https://kolarz.pl",
      email: "zamowienia@kolarz.pl",
    },
  });

  const bikestacja = await prisma.supplier.create({
    data: {
      name: "Bikestacja",
      url: "https://bikestacja.pl",
      email: "hurt@bikestacja.pl",
    },
  });

  // Powiązania dostawca-część (przykładowe ceny)
  await Promise.all([
    prisma.supplierPart.create({
      data: { supplierId: kolarz.id, partId: parts[0].id, price: 30.0 },
    }),
    prisma.supplierPart.create({
      data: { supplierId: kolarz.id, partId: parts[3].id, price: 48.0 },
    }),
    prisma.supplierPart.create({
      data: { supplierId: bikestacja.id, partId: parts[0].id, price: 32.0 },
    }),
    prisma.supplierPart.create({
      data: { supplierId: bikestacja.id, partId: parts[5].id, price: 22.0 },
    }),
  ]);

  // Przykładowa zakończona naprawa (dla kontekstu AI)
  await prisma.repair.create({
    data: {
      status: "COMPLETED",
      problemDesc: "Hamulce tarczowe słabo hamują, piszczą przy hamowaniu",
      aiDiagnosis: {
        summary: "Zużyte klocki hamulcowe, tarcza lekko zeszlifowana",
        issues: [
          {
            component: "Hamulce przednie",
            problem: "Klocki hamulcowe zużyte poniżej minimum",
            severity: "high",
            suggestedParts: [{ name: "Klocki hamulcowe Shimano B01S", category: "hamulce", estimatedPrice: 35 }],
          },
          {
            component: "Hamulce tylne",
            problem: "Klocki hamulcowe zużyte, tarcza do wymiany",
            severity: "high",
            suggestedParts: [
              { name: "Klocki hamulcowe Shimano B01S", category: "hamulce", estimatedPrice: 35 },
              { name: "Tarcza hamulcowa 160mm", category: "hamulce", estimatedPrice: 45 },
            ],
          },
        ],
        estimatedLaborMinutes: 45,
        urgency: "soon",
      },
      aiEstimate: {
        parts: [
          { name: "Klocki hamulcowe Shimano B01S", quantity: 2, unitPrice: 35, inStock: true },
          { name: "Tarcza hamulcowa 160mm", quantity: 1, unitPrice: 45, inStock: true },
        ],
        laborCost: 80,
        totalCost: 195,
      },
      laborCost: 80,
      totalCost: 195,
      bikeId: jan.bikes[0].id,
      parts: {
        create: [
          { partId: parts[0].id, quantity: 2, price: 35 },
          { partId: parts[9].id, quantity: 1, price: 45 },
        ],
      },
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
