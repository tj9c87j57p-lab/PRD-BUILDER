import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "lead-magnets");

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL;

const r2Client =
  r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName && r2PublicUrl
    ? new S3Client({
        region: "auto",
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
        },
      })
    : null;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export async function saveUploadedFile(
  file: File,
  subfolder: string
): Promise<string> {
  const filename = `${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (r2Client && r2BucketName && r2PublicUrl) {
    const key = `lead-magnets/${subfolder}/${filename}`;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: bytes,
        ContentType: file.type || "application/octet-stream",
      })
    );
    return `${r2PublicUrl.replace(/\/$/, "")}/${key}`;
  }

  console.log(
    "[storage] Cloudflare R2 not configured — writing to local disk (dev only, not durable in a real deploy)"
  );
  const dir = path.join(UPLOAD_ROOT, subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/lead-magnets/${subfolder}/${filename}`;
}
