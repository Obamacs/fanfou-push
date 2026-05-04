import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "avatars"; // 默认为avatars

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    // 限制文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "文件过大，请选择小于 10MB 的文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "只支持图片文件" },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${session.user.id}/${timestamp}-${random}-${file.name}`;

    // 确定bucket名称
    const bucketName = type === "event" ? "events" : "avatars";

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      // 如果bucket不存在，尝试创建
      if (error.message.includes("not found")) {
        try {
          await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });

          // 重试上传
          const { data: retryData, error: retryError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              contentType: file.type,
              upsert: false,
            });

          if (retryError) {
            return NextResponse.json(
              { error: "上传失败，请重试" },
              { status: 500 }
            );
          }

          // 获取公开URL
          const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(retryData.path);

          return NextResponse.json(
            { url: publicData.publicUrl },
            { status: 200 }
          );
        } catch (createError) {
          console.error("Create bucket error:", createError);
          return NextResponse.json(
            { error: "上传失败，请重试" },
            { status: 500 }
          );
        }
      }
      return NextResponse.json(
        { error: "上传失败，请重试" },
        { status: 500 }
      );
    }

    // 获取公开URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return NextResponse.json(
      { url: publicData.publicUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "上传失败，请重试" },
      { status: 500 }
    );
  }
}

