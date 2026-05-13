import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function sanitizeFileName(original: string): string {
  // Remove path separators and non-printable characters
  let name = original.replace(/[/\\:*?"<>|]/g, "-");
  // Replace spaces and non-ASCII with safe chars
  name = name.replace(/\s+/g, "-");
  // Remove any character that isn't alphanumeric, dash, underscore, or dot
  name = name.replace(/[^a-zA-Z0-9._-]/g, "");
  // Collapse multiple dots/dashes
  name = name.replace(/-+/g, "-").replace(/\.+/g, ".");
  // Ensure we have a valid extension
  if (!name.includes(".")) name = name + ".jpg";
  // Max safe filename length
  if (name.length > 100) {
    const ext = name.lastIndexOf(".") > 0 ? name.slice(name.lastIndexOf(".")) : "";
    name = name.slice(0, 100 - ext.length) + ext;
  }
  return name;
}

async function ensureBucket(supabase: ReturnType<typeof getSupabaseServiceClient>, bucketName: string) {
  try {
    // Try a lightweight operation to check if bucket exists
    const { error } = await supabase.storage.from(bucketName).list("", { limit: 1 });
    if (!error) return; // Bucket exists and accessible
    if (error.message?.includes("not found") || error.message?.includes("exist")) {
      const { error: createErr } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
      if (createErr) {
        // Bucket might already exist (race condition)
        if (!createErr.message?.includes("already exists")) {
          throw createErr;
        }
      }
    }
  } catch (e: any) {
    // If list failed for other reasons, try creating
    const { error: createErr } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    if (createErr && !createErr.message?.includes("already exists")) {
      console.error("Failed to ensure bucket:", bucketName, createErr);
      throw createErr;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "avatars";

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "文件不能超过 10MB" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "只支持 JPG、PNG、WebP、GIF 格式" }, { status: 400 });
    }

    const bucketName = type === "event" ? "events" : "avatars";
    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name);
    const filePath = `${session.user.id}/${timestamp}-${safeName}`;

    const supabase = getSupabaseServiceClient();
    await ensureBucket(supabase, bucketName);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", bucketName, filePath, error);
      return NextResponse.json({ error: "上传失败" }, { status: 500 });
    }

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicData.publicUrl });
  } catch (error: any) {
    console.error("Upload exception:", error);
    return NextResponse.json(
      { error: "上传失败" },
      { status: 500 }
    );
  }
}
