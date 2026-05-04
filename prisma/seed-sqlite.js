#!/usr/bin/env node

// 直接使用SQLite3库初始化数据库
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath);

const interests = [
  { name: "美食", icon: "🍽️" },
  { name: "旅行", icon: "✈️" },
  { name: "音乐", icon: "🎵" },
  { name: "电影", icon: "🎬" },
  { name: "读书", icon: "📚" },
  { name: "运动", icon: "🏃" },
  { name: "户外", icon: "🏕️" },
  { name: "游戏", icon: "🎮" },
  { name: "艺术", icon: "🎨" },
  { name: "摄影", icon: "📷" },
  { name: "烹饪", icon: "👨‍🍳" },
  { name: "舞蹈", icon: "💃" },
  { name: "健身", icon: "💪" },
  { name: "茶艺", icon: "🍵" },
  { name: "棋牌", icon: "♟️" },
  { name: "宠物", icon: "🐶" },
  { name: "手工", icon: "🧵" },
  { name: "科技", icon: "💻" },
  { name: "语言", icon: "🌐" },
  { name: "冥想", icon: "🧘" },
];

const questions = [
  {
    text: "你理想的周末是？",
    type: "single",
    options: JSON.stringify(["宅在家里放松", "和朋友聚餐聊天", "户外运动冒险", "参加文化活动"]),
    weight: 1.0,
    order: 1,
  },
  {
    text: "你在朋友圈中的角色是？",
    type: "single",
    options: JSON.stringify(["聚会组织者", "话题引导者", "倾听者和陪伴者", "观察者和记录者"]),
    weight: 1.0,
    order: 2,
  },
  {
    text: "你更喜欢哪种聚会方式？",
    type: "single",
    options: JSON.stringify(["小范围深度交流", "大人数热闹聚会", "一对一深度对话", "混合型即兴聚会"]),
    weight: 1.0,
    order: 3,
  },
  {
    text: "你对新事物的态度是？",
    type: "single",
    options: JSON.stringify(["积极拥抱变化", "谨慎尝试新事物", "需要时间适应", "保持传统做法"]),
    weight: 1.0,
    order: 4,
  },
  {
    text: "你最重视友谊中的哪些品质？",
    type: "single",
    options: JSON.stringify(["真诚和信任", "共同兴趣爱好", "相互支持帮助", "有趣和幽默感"]),
    weight: 1.0,
    order: 5,
  },
];

db.serialize(() => {
  // 插入兴趣
  let count = 0;
  interests.forEach((interest) => {
    db.run(
      `INSERT OR IGNORE INTO "Interest" (name, icon) VALUES (?, ?)`,
      [interest.name, interest.icon],
      (err) => {
        if (err) console.error("Error inserting interest:", err);
        else count++;
      }
    );
  });

  // 插入问题
  questions.forEach((question) => {
    db.run(
      `INSERT OR IGNORE INTO "QuestionnaireQuestion" (text, type, options, weight, "order") VALUES (?, ?, ?, ?, ?)`,
      [question.text, question.type, question.options, question.weight, question.order],
      (err) => {
        if (err) console.error("Error inserting question:", err);
      }
    );
  });

  setTimeout(() => {
    db.all(`SELECT COUNT(*) as count FROM "Interest"`, (err, rows) => {
      if (err) console.error("Error:", err);
      else console.log(`✓ 创建了 ${rows[0].count} 个兴趣`);
    });

    db.all(`SELECT COUNT(*) as count FROM "QuestionnaireQuestion"`, (err, rows) => {
      if (err) console.error("Error:", err);
      else console.log(`✓ 创建了 ${rows[0].count} 个问卷问题`);
      db.close();
    });
  }, 500);
});
