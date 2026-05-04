import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 缺少 Supabase 环境变量");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initBucket() {
  try {
    console.log("🔍 检查 avatars bucket...");
    
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarsBucket = buckets?.find(b => b.name === "avatars");

    if (avatarsBucket) {
      console.log("✅ avatars bucket 已存在");
      return;
    }

    console.log("📦 创建 avatars bucket...");
    const { data, error } = await supabase.storage.createBucket("avatars", {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });

    if (error) {
      console.error("❌ 创建失败:", error);
      process.exit(1);
    }

    console.log("✅ avatars bucket 创建成功");
    console.log("📍 Bucket 路径: avatars/");
    console.log("🔓 访问权限: 公开");
  } catch (err) {
    console.error("❌ 错误:", err);
    process.exit(1);
  }
}

initBucket();
