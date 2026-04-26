import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export async function seedCategories(prisma: PrismaClient) {
  console.log("  카테고리 시드 시작...");

  const tree = [
    {
      slug: "workwear",
      name: "작업복",
      children: [
        { slug: "workwear-top", name: "상의" },
        { slug: "workwear-bottom", name: "하의" },
        { slug: "workwear-set", name: "상하 세트" },
        { slug: "workwear-vest", name: "조끼" },
        { slug: "workwear-winter", name: "방한복" },
        { slug: "fnb-uniform", name: "F&B 유니폼" },
        { slug: "medical-uniform", name: "의료 / 위생복" },
      ],
    },
    {
      slug: "safety-shoes",
      name: "안전화",
      children: [
        { slug: "safety-shoes-6inch", name: "6인치" },
        { slug: "safety-shoes-8inch", name: "8인치" },
        { slug: "insulated-shoes", name: "절연화" },
        { slug: "waterproof-shoes", name: "방수화" },
        { slug: "winter-safety-shoes", name: "방한 안전화" },
      ],
    },
    {
      slug: "safety-equipment",
      name: "안전용품",
      children: [
        { slug: "safety-helmet", name: "안전모" },
        { slug: "mask", name: "마스크" },
        { slug: "safety-vest", name: "안전조끼" },
        { slug: "gloves", name: "장갑 / 보호구" },
      ],
    },
    {
      slug: "embroidery",
      name: "자수 / 마킹",
      children: [
        { slug: "embroidery-simulator", name: "시뮬레이터" },
        { slug: "embroidery-gallery", name: "갤러리" },
      ],
    },
    {
      slug: "brands",
      name: "브랜드관",
      children: [],
    },
  ];

  for (let i = 0; i < tree.length; i++) {
    const parent = tree[i];
    const parentRecord = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: { name: parent.name, sortOrder: i },
      create: { slug: parent.slug, name: parent.name, level: 0, sortOrder: i },
    });

    for (let j = 0; j < parent.children.length; j++) {
      const child = parent.children[j];
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, sortOrder: j },
        create: {
          slug: child.slug,
          name: child.name,
          parentId: parentRecord.id,
          level: 1,
          sortOrder: j,
        },
      });
    }
  }

  console.log("  ✓ 카테고리 시드 완료");
}
