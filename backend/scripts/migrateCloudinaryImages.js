import "dotenv/config";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import slugify from "slugify";

import Blog from "../model/blog.model.js";
import Product from "../model/product.model.js";
import ProductCategory from "../model/productCategory.model.js";
import Voucher from "../model/voucher.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const publicDir = path.join(rootDir, "frontend", "public");
const uploadRoot = path.join(publicDir, "uploads", "migrated");
const isDryRun = process.argv.includes("--dry-run");
const migrateAll = process.argv.includes("--all");

const imageCollections = [
  {
    name: "products",
    dir: "products",
    model: Product,
    field: "image",
    query: { image: /cloudinary/i },
  },
  {
    name: "productCategories",
    dir: "product-categories",
    model: ProductCategory,
    field: "image",
    query: { image: /cloudinary/i },
  },
];

if (migrateAll) {
  imageCollections.push(
    {
      name: "vouchers",
      dir: "vouchers",
      model: Voucher,
      field: "image",
      query: { image: /cloudinary/i },
    },
    {
      name: "blogs",
      dir: "blogs",
      model: Blog,
      field: "images",
      query: { images: /cloudinary/i },
      isArray: true,
    }
  );
}

const isCloudinaryUrl = (value) =>
  typeof value === "string" && /https?:\/\/res\.cloudinary\.com\//i.test(value);

const getExtension = (url, contentType) => {
  const pathname = new URL(url).pathname;
  const extFromPath = path.extname(pathname).toLowerCase();

  if (extFromPath && extFromPath.length <= 6) {
    return extFromPath;
  }

  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".jpg";
};

const makeFileName = (doc, url, ext) => {
  const label = doc.name || doc.title || "image";
  const slug = slugify(label, { lower: true, strict: true, locale: "vi" });
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 10);
  return `${slug || "image"}-${doc._id}-${hash}${ext}`;
};

const downloadImage = async (url, doc, targetDir) => {
  const previewExt = getExtension(url);
  const previewPath = path.join(targetDir, makeFileName(doc, url, previewExt));

  try {
    await fs.access(previewPath);
    return previewPath;
  } catch {
    // Continue and fetch the image. The response can provide a better extension.
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const ext = getExtension(url, contentType);
  const filePath = path.join(targetDir, makeFileName(doc, url, ext));

  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    return filePath;
  }
};

const toPublicPath = (filePath) => {
  const relativePath = path.relative(publicDir, filePath).split(path.sep).join("/");
  return `/${relativePath}`;
};

const migrateCollection = async (config) => {
  const targetDir = path.join(uploadRoot, config.dir);
  await fs.mkdir(targetDir, { recursive: true });

  const docs = await config.model.find(config.query).lean();
  let updated = 0;
  let downloaded = 0;

  for (const doc of docs) {
    if (config.isArray) {
      const nextImages = [];
      let changed = false;

      for (const image of doc[config.field] || []) {
        if (!isCloudinaryUrl(image)) {
          nextImages.push(image);
          continue;
        }

        const filePath = isDryRun ? path.join(targetDir, makeFileName(doc, image, getExtension(image))) : await downloadImage(image, doc, targetDir);
        const publicPath = toPublicPath(filePath);
        nextImages.push(publicPath);
        changed = true;
        downloaded += 1;
        console.log(`${config.name}: ${doc.title || doc.name || doc._id} -> ${publicPath}`);
      }

      if (changed && !isDryRun) {
        await config.model.updateOne({ _id: doc._id }, { $set: { [config.field]: nextImages } });
        updated += 1;
      }

      continue;
    }

    const image = doc[config.field];
    if (!isCloudinaryUrl(image)) continue;

    const filePath = isDryRun ? path.join(targetDir, makeFileName(doc, image, getExtension(image))) : await downloadImage(image, doc, targetDir);
    const publicPath = toPublicPath(filePath);
    console.log(`${config.name}: ${doc.name || doc.title || doc._id} -> ${publicPath}`);

    if (!isDryRun) {
      await config.model.updateOne({ _id: doc._id }, { $set: { [config.field]: publicPath } });
      updated += 1;
    }

    downloaded += 1;
  }

  return { collection: config.name, docs: docs.length, downloaded, updated };
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI. Create backend/.env before running this script.");
  }

  mongoose.set("strictQuery", false);
  await mongoose.connect(process.env.MONGO_URI);

  const results = [];
  for (const collection of imageCollections) {
    results.push(await migrateCollection(collection));
  }

  await mongoose.disconnect();
  console.table(results);

  if (isDryRun) {
    console.log("Dry run only. Run without --dry-run to download files and update the database.");
  }
};

main().catch(async (error) => {
  await mongoose.disconnect().catch(() => {});
  console.error(error);
  process.exit(1);
});
