"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";

export default function GalleryPage() {
  const images = [
    {
      title: "社交聚餐",
      description: "多样化的年轻人在温暖的烛光下享受美食和对话",
      src: "/dinner-event.jpg",
      alt: "Dinner gathering with diverse young people",
    },
    {
      title: "晨间跑步",
      description: "充满活力的晨间运动，展现年轻人的健康生活方式",
      src: "/running-event.jpg",
      alt: "Morning running group",
    },
    {
      title: "艺术文化",
      description: "在现代艺术馆中的文化交流和创意碰撞",
      src: "/art-event.jpg",
      alt: "Art gallery gathering",
    },
    {
      title: "屋顶酒吧",
      description: "日落时分，年轻人在屋顶酒吧享受社交时光",
      src: "/drinks-event.jpg",
      alt: "Rooftop bar social gathering",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">活动图片库</h1>
        <p className="text-gray-600">
          精心生成的高质量图片，展现饭否社区的多样化活动和年轻人的社交风采
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((image, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-lg card-hover">
            <div className="relative h-64 bg-gray-200">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index < 2}
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {image.title}
              </h3>
              <p className="text-gray-600">{image.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
        <h3 className="font-bold text-gray-900 mb-3">📸 图片生成信息</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✨ 所有图片由 AI 生成，展现多样化的年轻中国人和少数民族</li>
          <li>🎨 采用时尚现代的视觉风格，符合小红书美学</li>
          <li>📝 图片中最小化文字，强调视觉设计和真实连接</li>
          <li>🌍 每张图片都经过精心提示词优化，确保高质量和品牌一致性</li>
        </ul>
      </Card>
    </div>
  );
}
