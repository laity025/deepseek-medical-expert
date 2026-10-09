// ============================================================
// DeepSeek 医疗专家模型 汇报 PPT 生成脚本 (pptxgenjs) — 绝对坐标版
// 运行:  $env:NODE_PATH=(npm root -g); node docs/build_deck.js
// 输出:  docs/DeepSeek医疗专家模型汇报.pptx
// 布局: 16:9 (10 x 5.625 in)，安全区 0.5~9.5 / 0.5~5.25
// ============================================================
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const pres = new PptxGenJS();

// ===== 调色板 =====
const C = {
  dark: '053B38', dark2: '0B8074', primary: '0E9F8F',
  accent: 'F2B134', bg: 'F2F8F7', card: 'FFFFFF',
  text: '20303B', muted: '6B7A89', line: 'D6E6E2', gold: 'FFF6E3'
};
const ST = '宋体', BY = '微软雅黑';

pres.layout = 'LAYOUT_16x9';
const SW = 10, SH = 5.625;           // 页尺寸(in)
const L = 0.5, R = 0.5, T = 0.5;     // 边距

// ===== 图片按比例缩放，返回居中后的绝对坐标 =====
function imgFit(pathStr, ax, ay, aw, ah, totW, totH) {
  const m = String(pathStr).match(/_(\d+)x(\d+)\.(png|jpe?g|gif|webp)$/i);
  if (!m) return { path: pathStr, x: ax, y: ay, w: aw, h: ah };
  const ia = m[1] / m[2], ta = aw / ah;
  let x = ax, y = ay, w = aw, h = ah;
  if (ia > ta) { w = aw; h = aw / ia; y = ay + (ah - h) / 2; }
  else { h = ah; w = ah * ia; x = ax + (aw - w) / 2; }
  return { path: pathStr, x, y, w, h }; void totW; void totH;
}

let PAGE = 0;
function newLight() { PAGE++; const s = pres.addSlide(); s.background = { color: C.bg }; return s; }
function header(s, title) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 0.42, w: 0.13, h: 0.5, fill: { color: C.primary }, line: { type: 'none' } });
  s.addText(title, { x: 0.78, y: 0.33, w: 8.2, h: 0.6, fontFace: ST, fontSize: 26, color: C.text, bold: true, charSpacing: 1.5, align: 'left', margin: 0 });
}
function footer(s, label) {
  s.addText(label, { x: 0.5, y: 5.24, w: 6, h: 0.26, fontFace: BY, fontSize: 9, color: C.muted, align: 'left', margin: 0 });
  s.addText(String(PAGE), { x: 9.3, y: 5.24, w: 0.25, h: 0.26, fontFace: BY, fontSize: 9, color: C.muted, align: 'right', margin: 0 });
}
function rcard(x, y, w, h, fill, line) {
  return pres.addSlide ? null : null; // placeholder (unused)
}
function secDiv(no, en, title, desc) {
  PAGE++; const s = pres.addSlide(); s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.22, h: SH, fill: { color: C.primary }, line: { type: 'none' } });
  s.addText(String(no).padStart(2, '0'), { x: 0.8, y: 1.0, w: 2.4, h: 2.6, fontFace: ST, fontSize: 86, color: C.primary, bold: true, charSpacing: 2, align: 'left', margin: 0 });
  s.addText(en, { x: 0.85, y: 3.0, w: 8, h: 0.5, fontFace: BY, fontSize: 18, color: C.accent, charSpacing: 2, align: 'left', margin: 0 });
  s.addText(title, { x: 0.85, y: 3.4, w: 8.4, h: 0.9, fontFace: ST, fontSize: 40, color: 'FFFFFF', bold: true, charSpacing: 2, align: 'left', margin: 0 });
  if (desc) s.addText(desc, { x: 0.85, y: 4.45, w: 8.2, h: 0.6, fontFace: BY, fontSize: 14, color: 'CFE8E4', align: 'left', margin: 0 });
}

// ================= S1 封面 =================
(() => { PAGE++; const s = pres.addSlide(); s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: SW, h: 0.16, fill: { color: C.primary }, line: { type: 'none' } });
  s.addText('\uD83C\uDFE5', { x: 0.7, y: 0.55, w: 1, h: 1, fontFace: 'Segoe UI Emoji', fontSize: 40, align: 'left', margin: 0 });
  s.addText('基于 DeepSeek 大模型微调的\n医疗专家模型', { x: 0.7, y: 1.35, w: 8.8, h: 2.1, fontFace: ST, fontSize: 41, color: 'FFFFFF', bold: true, charSpacing: 2, align: 'left', margin: 0, lineSpacingMultiple: 1.15 });
  s.addText('Medical Expert LLM fine-tuned by DeepSeek + LoRA', { x: 0.74, y: 3.45, w: 8.5, h: 0.4, fontFace: BY, fontSize: 14, color: C.primary, align: 'left', margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.74, y: 4.0, w: 6.0, h: 0.03, fill: { color: C.primary }, line: { type: 'none' } });
  s.addText('课程汇报 · 大模型微调实战 · 2026-09', { x: 0.7, y: 4.2, w: 8, h: 0.4, fontFace: BY, fontSize: 14, color: 'CFE8E4', align: 'left', margin: 0 });
  s.addText('DeepSeek-R1-Distill-Qwen-1.5B · PEFT / LoRA · FastAPI 部署', { x: 0.7, y: 4.7, w: 8.5, h: 0.35, fontFace: BY, fontSize: 11, color: '8FBFB8', align: 'left', margin: 0 });
})();

// ================= S2 目录 =================
(() => { const s = newLight();
  s.addText('CONTENTS', { x: 0.7, y: 0.5, w: 3, h: 0.4, fontSize: 15, fontFace: BY, color: C.muted, charSpacing: 3, align: 'left', margin: 0 });
  s.addText('汇报目录', { x: 0.7, y: 0.85, w: 4, h: 0.7, fontSize: 34, fontFace: ST, color: C.text, bold: true, align: 'left', margin: 0 });
  const items = [['01','背景与问题','通用大模型在医疗场景的瓶颈'],['02','技术方案','模型选型 · 微调框架'],['03','数据准备','医疗问答数据集构建'],['04','LoRA 微调','参数配置 · 训练 · 损失'],['05','效果验证与部署','微调前后对比 · 接口化部署'],['06','总结与展望','成果 · 调优方向']];
  const cw = 4.15, ch = 1.0;
  items.forEach((it, i) => { const col = i % 2, row = Math.floor(i / 2); const x = 0.7 + col * 4.5, y = 1.75 + row * 1.25;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.line } });
    s.addText(it[0], { x: x + 0.2, y: y + 0.18, w: 0.9, h: 0.6, fontSize: 25, fontFace: ST, color: C.primary, bold: true, align: 'center', margin: 0 });
    s.addText(it[1], { x: x + 1.15, y: y + 0.16, w: 2.85, h: 0.42, fontSize: 17, fontFace: ST, color: C.text, bold: true, align: 'left', margin: 0 });
    s.addText(it[2], { x: x + 1.15, y: y + 0.62, w: 2.85, h: 0.3, fontSize: 10.5, fontFace: BY, color: C.muted, align: 'left', margin: 0 });
  });
  footer(s, 'DeepSeek 医疗专家 · 汇报');
})();

// ================= S3 四大瓶颈 =================
(() => { const s = newLight(); header(s, '通用大模型在医疗领域的四大瓶颈');
  const rows = [
    ['专业术语理解偏差', '混淆医学专有词（如“转移”指癌扩散而非普通词义）', '诊断建议错误、报告误读'],
    ['逻辑推理严谨性不足', '忽略医学上下文（如患者过敏史、禁忌用药）', '推荐禁忌药物、方案冲突'],
    ['知识更新滞后性', '依赖过时指南（如旧版肿瘤分期标准）', '不符合最新临床实践'],
    ['隐私难以保障', '难以遵循 HIPAA 等医疗隐私法规', '数据泄露、法律追责']];
  rows.forEach((r, i) => { const y = 1.4 + i * 0.78;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9.0, h: 0.66, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: y + 0.1, w: 0.07, h: 0.46, fill: { color: C.primary }, line: { type: 'none' } });
    s.addText(r[0], { x: 0.72, y: y + 0.1, w: 2.5, h: 0.46, fontSize: 15, fontFace: ST, color: C.primary, bold: true, align: 'left', margin: 0 });
    s.addText(r[1], { x: 3.3, y: y + 0.1, w: 3.8, h: 0.46, fontSize: 12, fontFace: BY, color: C.text, align: 'left', margin: 0 });
    s.addText('→ 风险：' + r[2], { x: 7.2, y: y + 0.1, w: 2.2, h: 0.46, fontSize: 11.5, fontFace: BY, color: C.accent, bold: true, align: 'left', margin: 0 });
  });
  const y = 1.4 + 4 * 0.78 + 0.1;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9.0, h: 0.7, rectRadius: 0.08, fill: { color: C.gold }, line: { type: 'none' } });
  s.addText('核心结论：微调能优化问答语气、增强推理、灌注领域知识 —— 医疗正是一个强专业、高价值的典型场景。', { x: 0.7, y: y + 0.12, w: 8.6, h: 0.5, fontSize: 13.5, fontFace: ST, color: '8A6300', bold: true, align: 'center', margin: 0 });
  footer(s, '01 背景与问题');
})();

// ================= S4 项目价值 =================
(() => { const s = newLight(); header(s, '项目价值：医疗专家大模型的受益方');
  const cards = [
    ['\uD83D\uDC64', '患者端', ['7×24 智能应答', '秒级响应急诊咨询'], '辅助健康知识普及'],
    ['\uD83E\uDE7A', '医生端', ['辅助跨学科病例分析', '诊疗参考'], '减轻事务性工作负担'],
    ['\uD83C\uDFE2', '机构端', ['医疗经验固化', '知识库集成'], '降低知识流失风险']];
  cards.forEach((c, i) => { const x = 0.5 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 2.9, h: 3.1, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
    s.addText(c[0], { x: x + 0.2, y: 1.75, w: 2.5, h: 0.9, fontSize: 42, align: 'center', fontFace: 'Segoe UI Emoji', margin: 0 });
    s.addText(c[1], { x: x + 0.2, y: 2.7, w: 2.5, h: 0.5, fontSize: 19, fontFace: ST, color: C.primary, bold: true, align: 'center', margin: 0 });
    c[2].forEach((line, li) => { s.addText('· ' + line, { x: x + 0.35, y: 3.3 + li * 0.4, w: 2.3, h: 0.35, fontSize: 12, fontFace: BY, color: C.text, align: 'left', margin: 0 }); });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.35, y: 4.15, w: 2.2, h: 0.32, rectRadius: 0.5, fill: { color: C.bg }, line: { color: C.line } });
    s.addText(c[3], { x: x + 0.35, y: 4.18, w: 2.2, h: 0.26, fontSize: 10.5, fontFace: BY, color: C.muted, align: 'center', margin: 0 });
  });
  footer(s, '01 背景与问题');
})();

// ================= S5 技术方案 =================
(() => { const s = newLight(); header(s, '技术方案：模型选型与微调框架');
  // 左：模型
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.35, w: 4.4, h: 3.75, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
  s.addText('模型选型', { x: 0.8, y: 1.5, w: 3.7, h: 0.5, fontSize: 18, fontFace: ST, color: C.text, bold: true, margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 2.08, w: 3.8, h: 0.9, rectRadius: 0.08, fill: { color: C.bg }, line: { color: C.primary } });
  s.addText('DeepSeek-R1-Distill-Qwen-1.5B', { x: 0.82, y: 2.15, w: 3.76, h: 0.4, fontSize: 14, fontFace: ST, color: C.primary, bold: true, align: 'center', margin: 0 });
  s.addText('R1 推理蒸馏到小参数，8GB 显存即可运行，适合现场演示（本项目采用）', { x: 0.9, y: 3.1, w: 3.7, h: 0.7, fontSize: 11, fontFace: BY, color: C.muted, align: 'left', margin: 0, autoFit: false, fit: 'none' });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.95, w: 0.06, h: 0.85, fill: { color: C.accent }, line: { type: 'none' } });
  s.addText('R1 Distill 基于 Qwen2.5/Llama3 蒸馏，实现推理能力高效迁移；更大算力可换 7B/8B 基座提升诊断精度。', { x: 1.0, y: 3.98, w: 3.7, h: 0.85, fontSize: 11.5, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none', lineSpacingMultiple: 1.15 });
  // 右：框架
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.1, y: 1.35, w: 4.4, h: 3.75, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
  s.addText('微调框架', { x: 5.4, y: 1.5, w: 3.7, h: 0.5, fontSize: 18, fontFace: ST, color: C.text, bold: true, margin: 0 });
  const fr = [['PEFT / LoRA ✓', '参数高效、显存低，本项目主选'], ['LLaMA-Factory', '零代码 WebUI，快速演示（备选）'], ['Unsloth / XTuner / SWIFT', '轻量化、可选项']];
  fr.forEach((f, i) => { const ry = 2.15 + i * 0.62;
    s.addText(f[0], { x: 5.4, y: ry, w: 2.1, h: 0.4, fontSize: 13.5, fontFace: ST, color: C.primary, bold: true, align: 'left', margin: 0 });
    s.addText(f[1], { x: 7.45, y: ry, w: 1.95, h: 0.5, fontSize: 11.5, fontFace: BY, color: C.muted, align: 'left', margin: 0, autoFit: false, fit: 'none' }); });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.4, y: 4.1, w: 3.8, h: 0.62, rectRadius: 0.08, fill: { color: C.gold }, line: { type: 'none' } });
  s.addText('LoRA 只训练低秩矩阵，微调后合并回基座，部署无需额外适配器', { x: 5.55, y: 4.18, w: 3.6, h: 0.45, fontSize: 10.5, fontFace: BY, color: '8A6300', bold: true, align: 'left', margin: 0, autoFit: false, fit: 'none' });
  footer(s, '02 技术方案');
})();

// ================= S6 全流程 =================
(() => { const s = newLight(); header(s, '全流程：从环境到部署');
  const steps = ['环境准备','数据准备','模型准备','格式转换','LoRA 微调','结果验证','模型合并','接口部署'];
  const bx = [0.5, 2.68, 4.86, 7.04], rows = [1.5, 2.85];
  steps.forEach((st, i) => { const row = Math.floor(i / 4), col = i % 4; const x = bx[col], y = rows[row];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.05, h: 1.0, rectRadius: 0.12, fill: { color: C.card }, line: { color: C.primary, width: 1.2 } });
    s.addText(String(i + 1), { x: x + 0.1, y: y + 0.06, w: 0.45, h: 0.3, fontSize: 12, fontFace: ST, color: C.accent, bold: true, align: 'center', margin: 0 });
    s.addText(st, { x: x + 0.05, y: y + 0.42, w: 1.95, h: 0.5, fontSize: 14.5, fontFace: ST, color: C.text, bold: true, align: 'center', margin: 0 });
    if (col < 3) s.addShape(pres.shapes.RECTANGLE, { x: x + 2.14, y: y + 0.43, w: 0.1, h: 0.16, fill: { color: C.primary }, line: { type: 'none' } });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.15, w: 0.06, h: 0.85, fill: { color: C.accent }, line: { type: 'none' } });
  s.addText('本项目完整实现该链条：前六步在汇报中现场运行，最后两步“合并、部署”落地为可交付的医疗模型与 HTTP 服务。', { x: 0.75, y: 4.18, w: 8.5, h: 0.85, fontSize: 13.5, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none', lineSpacingMultiple: 1.2 });
  footer(s, '02 技术方案');
})();

// ================= S7 数据格式 =================
(() => { const s = newLight(); header(s, '数据准备：格式转换（data_process.py）');
  const cw = 4.0;
  // 左：原始
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.4, w: cw, h: 3.7, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
  s.addText('原始数据 · medical_cot_zh.jsonl', { x: 0.75, y: 1.55, w: 3.6, h: 0.45, fontSize: 14, fontFace: ST, color: C.muted, bold: true, margin: 0 });
  const raw = [['Question', '患者提问 / 症状描述（模型输入）'], ['Complex_CoT', '医学思考过程（要模仿的推理）'], ['Response', '最终医学答案']];
  raw.forEach((r, i) => { const ry = 2.25 + i * 0.78;
    s.addText(r[0], { x: 0.75, y: ry, w: 1.8, h: 0.4, fontSize: 13, fontFace: BY, color: C.primary, bold: true, align: 'left', margin: 0 });
    s.addText(r[1], { x: 2.55, y: ry, w: 1.85, h: 0.55, fontSize: 10.5, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none' }); });
  s.addText('约 2 万条医学问答对', { x: 0.75, y: 4.5, w: 3.6, h: 0.35, fontSize: 11, fontFace: BY, color: C.muted, align: 'left', margin: 0 });
  // 箭头
  s.addText('→', { x: 4.55, y: 3.0, w: 0.4, h: 0.7, fontSize: 34, fontFace: BY, color: C.accent, bold: true, align: 'center', margin: 0 });
  // 右：转换后
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.0, y: 1.4, w: cw, h: 3.7, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.primary, width: 1.2 } });
  s.addText('转换后 · train.jsonl / val.jsonl', { x: 5.25, y: 1.55, w: 3.6, h: 0.45, fontSize: 14, fontFace: ST, color: C.primary, bold: true, margin: 0 });
  const fmt = [['"input"', '用户问题（Question）'], ['"output"', '思考链 + 答案（CoT\\nResponse）'], ['"instruction"', '系统角色：医疗专家设定']];
  fmt.forEach((f, i) => { const ry = 2.25 + i * 0.78;
    s.addText(f[0], { x: 5.25, y: ry, w: 1.7, h: 0.4, fontSize: 13, fontFace: BY, color: C.primary, bold: true, align: 'left', margin: 0 });
    s.addText(f[1], { x: 6.95, y: ry, w: 1.95, h: 0.55, fontSize: 10.5, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none' }); });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.25, y: 4.5, w: 3.5, h: 0.42, rectRadius: 0.08, fill: { color: C.gold }, line: { type: 'none' } });
  s.addText('按 9:1 划分成训练集 / 验证集', { x: 5.35, y: 4.56, w: 3.3, h: 0.3, fontSize: 11, fontFace: BY, color: '8A6300', bold: true, align: 'center', margin: 0 });
  footer(s, '03 数据准备');
})();

// ================= S8 数据规模 =================
(() => { const s = newLight(); header(s, '数据划分与规模');
  const stats = [['2 万条', '原始医学问答对'], ['1000', '训练集样本（上限可控）'], ['100', '验证集样本'], ['9 : 1', '训练 / 验证比例']];
  stats.forEach((st, i) => { const x = 0.5 + i * 2.32;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 2.15, h: 1.5, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
    s.addText(st[0], { x: x + 0.1, y: 1.75, w: 1.95, h: 0.6, fontSize: 23, fontFace: ST, color: C.primary, bold: true, align: 'center', margin: 0 });
    s.addText(st[1], { x: x + 0.1, y: 2.45, w: 1.95, h: 0.4, fontSize: 11, fontFace: BY, color: C.muted, align: 'center', margin: 0, autoFit: false, fit: 'none' }); });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.35, w: 9.0, h: 1.6, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
  s.addText('设计权衡', { x: 0.8, y: 3.55, w: 2, h: 0.4, fontSize: 15, fontFace: ST, color: C.text, bold: true, margin: 0 });
  s.addText('· 用 TRAIN_COUNT / VAL_COUNT 控制采样量，把单次训练控制在“现场可演示”时长（≈1 小时）内\n· 对超长思考链截断、但完整保留标准答案，让模型聚焦“先思考后回答”的医学推理\n· 固定随机种子，保证训练 / 验证划分可复现', { x: 0.8, y: 4.0, w: 8.4, h: 0.85, fontSize: 12.5, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none', lineSpacingMultiple: 1.25 });
  footer(s, '03 数据准备');
})();

// ================= S9 LoRA 原理 =================
(() => { const s = newLight(); header(s, 'LoRA：参数高效微调（PEFT）');
  // 左
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.35, w: 4.6, h: 3.75, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
  s.addText('全参数微调', { x: 0.8, y: 1.55, w: 1.9, h: 0.4, fontSize: 14, fontFace: ST, color: C.muted, bold: true, margin: 0 });
  s.addText('更新全部权重 · 显存 / 成本高', { x: 0.85, y: 2.0, w: 3.9, h: 0.4, fontSize: 12, fontFace: BY, color: C.text, align: 'left', margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.45, w: 4.0, h: 0.03, fill: { color: C.line }, line: { type: 'none' } });
  s.addText('LoRA 微调', { x: 0.8, y: 2.6, w: 1.9, h: 0.4, fontSize: 15, fontFace: ST, color: C.primary, bold: true, margin: 0 });
  ['冻结原始权重，只训练低秩矩阵 B·A', 'ΔW = B·A，远小于全模型参数量', '显存占用低 → 8GB 显卡也能训练'].forEach((p, i) => { s.addText('✓ ' + p, { x: 0.85, y: 3.1 + i * 0.42, w: 4.0, h: 0.36, fontSize: 12, fontFace: BY, color: C.text, align: 'left', margin: 0 }); });
  // 右
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.3, y: 1.35, w: 4.2, h: 3.75, rectRadius: 0.1, fill: { color: C.dark }, line: { type: 'none' } });
  s.addText('h = W₀·x + ΔW·x\nΔW = (α/r) · B·A', { x: 5.5, y: 1.7, w: 3.8, h: 1.2, fontSize: 18, fontFace: BY, color: 'FFFFFF', bold: true, align: 'center', margin: 0, lineSpacingMultiple: 1.15 });
  s.addText('r 低秩维数 · α 缩放系数\n（本项目 r=16, α=32，α=2r）', { x: 5.5, y: 3.15, w: 3.8, h: 0.8, fontSize: 12, fontFace: BY, color: 'CFE8E4', align: 'center', margin: 0, autoFit: false, fit: 'none' });
  s.addText('作用：让模型学会“医疗专家式”\n的表达范式与规范建议', { x: 5.5, y: 3.9, w: 3.8, h: 0.7, fontSize: 12.5, fontFace: ST, color: C.accent, bold: true, align: 'center', margin: 0, autoFit: false, fit: 'none' });
  footer(s, '04 LoRA 微调');
})();

// ================= S10 LoRA 配置 =================
(() => { const s = newLight(); header(s, 'LoRA 配置参数（LoraConfig）');
  const rows = [['r', '16', '低秩矩阵维数（提至 16，增强医学知识容量）'],
    ['lora_alpha', '32', '缩放系数，与 r 配套（α=2r）'],
    ['lora_dropout', '0.05', 'LoRA 层丢弃率，范围 [0,1)'],
    ['target_modules', 'q/k/v/o、gate/up/down_proj', '覆盖 Qwen2.5 架构全部注意力与 MLP 矩阵'],
    ['task_type', 'CAUSAL_LM', '因果语言建模任务']];
  rows.forEach((r, i) => { const y = 1.5 + i * 0.72;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9.0, h: 0.62, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: y + 0.08, w: 0.06, h: 0.46, fill: { color: C.primary }, line: { type: 'none' } });
    s.addText(r[0], { x: 0.72, y: y + 0.11, w: 1.7, h: 0.4, fontSize: 13.5, fontFace: ST, color: C.primary, bold: true, align: 'left', margin: 0 });
    s.addText(r[1], { x: 2.5, y: y + 0.11, w: 2.6, h: 0.4, fontSize: 12.5, fontFace: BY, color: C.text, align: 'left', margin: 0 });
    s.addText(r[2], { x: 5.2, y: y + 0.11, w: 4.2, h: 0.4, fontSize: 11.5, fontFace: BY, color: C.muted, align: 'left', margin: 0 });
  });
  footer(s, '04 LoRA 微调');
})();

// ================= S11 训练参数 =================
(() => { const s = newLight(); header(s, '训练参数（TrainingArguments）');
  const rows = [['num_train_epochs', '2', '1000 条 ×2 ≈ 500 步，1 小时内收敛'],
    ['learning_rate', '5e-5', '微降以缓解训练损失震荡'],
    ['per_device_train_batch_size', '1', '8GB 显存友好'],
    ['gradient_accumulation_steps', '4', '等效 batch=4，稳定训练'],
    ['eval_strategy / eval_steps', 'steps / 50', '训练过程多次验证'],
    ['logging_steps', '10', '每 10 步打印日志'],
    ['save_steps / save_total_limit', '25 / 2', '按步保存，最多保留 2 份']];
  rows.forEach((r, i) => { const y = 1.45 + i * 0.52;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9.0, h: 0.44, rectRadius: 0.07, fill: { color: C.card }, line: { color: C.line } });
    s.addText(r[0], { x: 0.75, y: y + 0.06, w: 3.0, h: 0.32, fontSize: 11.5, fontFace: ST, color: C.primary, bold: true, align: 'left', margin: 0 });
    s.addText(r[1], { x: 3.8, y: y + 0.06, w: 2.0, h: 0.32, fontSize: 11.5, fontFace: BY, color: C.text, align: 'left', margin: 0 });
    s.addText(r[2], { x: 5.9, y: y + 0.06, w: 3.5, h: 0.32, fontSize: 11, fontFace: BY, color: C.muted, align: 'left', margin: 0 });
  });
  footer(s, '04 LoRA 微调');
})();

// ================= S12 训练结果 =================
(() => { const s = newLight(); header(s, '训练结果与损失曲线');
  s.addImage(imgFit('docs/assets/loss_curve_1693x1092.png', 0.5, 1.4, 5.6, 3.7, 5.6, 3.7));
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.4, y: 1.4, w: 3.1, h: 3.6, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.primary, width: 1.2 } });
  s.addText('收敛情况', { x: 6.62, y: 1.55, w: 2.6, h: 0.4, fontSize: 16, fontFace: ST, color: C.primary, bold: true, margin: 0 });
  ['训练损失（蓝）整体下降', '验证损失（橙）同步收敛', '两者无明显偏离 → 未过拟合', 'LoRA 有效学到医疗知识'].forEach((p, i) => { const y = 2.15 + i * 0.62;
    s.addShape(pres.shapes.OVAL, { x: 6.7, y: y + 0.06, w: 0.16, h: 0.16, fill: { color: C.primary }, line: { type: 'none' } });
    s.addText(p, { x: 7.0, y, w: 2.4, h: 0.4, fontSize: 12, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none' }); });
  footer(s, '04 LoRA 微调');
})();

// ================= S13 模型合并 =================
(() => { const s = newLight(); header(s, '模型合并：LoRA → 医疗专家模型');
  const steps = [['原始基座', 'DeepSeek-R1-Distill\n-1.5B'], ['LoRA 权重', 'output/\ncheckpoint-500'], ['合并', 'merge_and\n_unload()'], ['医疗专家', '…-1.5B\n-Medical']];
  steps.forEach((st, i) => { const x = 0.5 + i * 2.14;
    const isLast = i === 3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 1.8, h: 1.9, rectRadius: 0.1, fill: { color: isLast ? C.primary : C.card }, line: { color: C.primary } });
    s.addText(st[0], { x: x + 0.1, y: 1.75, w: 1.6, h: 0.5, fontSize: 13.5, fontFace: ST, color: isLast ? 'FFFFFF' : C.text, bold: true, align: 'center', margin: 0, autoFit: false, fit: 'none' });
    s.addText(st[1], { x: x + 0.1, y: 2.35, w: 1.6, h: 0.95, fontSize: 10.5, fontFace: BY, color: isLast ? 'EAF7F5' : C.muted, align: 'center', margin: 0, autoFit: false, fit: 'none', lineSpacingMultiple: 1.15 });
  });
  ['+', '+'].forEach((op, i) => { const opx = 0.5 + i * 2.14 + 1.88; // 卡片宽改为1.8后间隙约0.34in，气泡居中该间隙内
    s.addShape(pres.shapes.OVAL, { x: opx, y: 2.25, w: 0.2, h: 0.2, fill: { color: C.accent }, line: { type: 'none' } });
    s.addText(op, { x: opx, y: 2.26, w: 0.2, h: 0.19, fontSize: 12, fontFace: ST, color: 'FFFFFF', bold: true, align: 'center', margin: 0 }); });
  if (false) s.addText('→', { x: 8.2, y: 2.2, w: 0.4, h: 0.6, fontSize: 24, color: C.accent, align: 'center', margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.9, w: 9.0, h: 0.9, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
  s.addText('合并后推理不再加载 LoRA 适配器 → 加载更快、部署更简洁（deepseek_merge.py）', { x: 0.75, y: 4.15, w: 8.5, h: 0.4, fontSize: 13.5, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none' });
  footer(s, '05 效果验证与部署');
})();

// ================= S14 效果验证对比 =================
(() => { const s = newLight(); header(s, '效果验证：微调前后回答对比');
  const before = ['回答冗长、思考链口语化','表述松散、建议不够严谨','含“饮用淡盐水”等不规范建议'];
  const beforeTxt = '“……首先，我得考虑用户可能是什么\n身份……\\n### 饮食控制：1.低糖高纤维…\n3.适量饮用淡盐水：每天 2-3 杯…\n### 运动建议：1.中等强度有氧…\n2.力量训练…\n3.避免过度运动…”';
  const after = ['结构清晰、先结论后分点','医学术语规范、表述严谨','“### 饮食/运动建议 + 总结”收束'];
  const afterTxt = '“对 2 型糖尿病患者来说，日常饮食和\n运动安排至关重要…\\n### 饮食建议：1.高纤维…2.低盐…\n3.均衡…4.避免高脂…\\n### 运动建议：1.避免高糖…\\n### 总结：通过合理饮食与适量运动…\n促进健康生活方式。”';
  // 左
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.3, w: 4.45, h: 0.06, fill: { color: C.accent }, line: { type: 'none' } });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.36, w: 4.45, h: 3.45, rectRadius: 0.08, fill: { color: 'FBEFD8' }, line: { color: C.accent } });
  s.addText('微调前 · 原始基座', { x: 0.8, y: 1.5, w: 3.8, h: 0.45, fontSize: 15, fontFace: ST, color: '8A5A14', bold: true, margin: 0 });
  before.forEach((b, i) => { s.addText(b, { x: 0.85, y: 2.0 + i * 0.38, w: 3.85, h: 0.34, fontSize: 12, fontFace: BY, color: '8A5A14', align: 'left', margin: 0 }); });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.2, w: 4.45, h: 0.02, fill: { color: C.accent }, line: { type: 'none' } });
  s.addText(beforeTxt, { x: 0.8, y: 3.35, w: 3.85, h: 1.35, fontSize: 10, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none', lineSpacingMultiple: 1.3 });
  // 右
  s.addShape(pres.shapes.RECTANGLE, { x: 5.05, y: 1.3, w: 4.45, h: 0.06, fill: { color: C.primary }, line: { type: 'none' } });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.05, y: 1.36, w: 4.45, h: 3.45, rectRadius: 0.08, fill: { color: 'EAF7F5' }, line: { color: C.primary } });
  s.addText('微调后 · 医疗专家', { x: 5.35, y: 1.5, w: 3.8, h: 0.45, fontSize: 15, fontFace: ST, color: C.dark2, bold: true, margin: 0 });
  after.forEach((a, i) => { s.addText(a, { x: 5.4, y: 2.0 + i * 0.38, w: 3.85, h: 0.34, fontSize: 12, fontFace: BY, color: C.dark2, align: 'left', margin: 0 }); });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.05, y: 3.2, w: 4.45, h: 0.02, fill: { color: C.primary }, line: { type: 'none' } });
  s.addText(afterTxt, { x: 5.35, y: 3.35, w: 3.85, h: 1.35, fontSize: 10, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none', lineSpacingMultiple: 1.3 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.95, w: 9.0, h: 0.3, rectRadius: 0.5, fill: { color: C.gold }, line: { type: 'none' } });
  s.addText('演示题：开放式常见病咨询（糖尿病生活建议） · 输出来自 deepseek_val.py 实测', { x: 0.6, y: 4.98, w: 8.8, h: 0.24, fontSize: 10.5, fontFace: BY, color: '8A6300', bold: true, align: 'center', margin: 0 });
  footer(s, '05 效果验证与部署');
})();

// ================= S15 接口部署 =================
(() => { const s = newLight(); header(s, '部署：FastAPI 推理服务（两种形态）');
  const rows = [
    ['deepseek_deploy.py', '纯 API 服务', '端口 8000', '/chat（POST）· /health'],
    ['deepseek_deploy_ui.py', '界面化服务', '端口 8001', '可视化界面 + /chat/stream (SSE 流式)']];
  rows.forEach((r, i) => { const y = 1.5 + i * 1.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9.0, h: 1.2, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.primary } });
    s.addText(r[0], { x: 0.8, y: y + 0.18, w: 3.2, h: 0.5, fontSize: 15, fontFace: ST, color: C.primary, bold: true, margin: 0 });
    s.addText(r[1], { x: 4.1, y: y + 0.22, w: 1.8, h: 0.42, fontSize: 13, fontFace: BY, color: C.text, align: 'center', margin: 0 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.0, y: y + 0.35, w: 1.1, h: 0.42, rectRadius: 0.5, fill: { color: C.bg }, line: { color: C.primary } });
    s.addText(r[2], { x: 6.05, y: y + 0.4, w: 1.0, h: 0.32, fontSize: 11, fontFace: BY, color: C.primary, bold: true, align: 'center', margin: 0 });
    s.addText(r[3], { x: 7.3, y: y + 0.35, w: 2.1, h: 0.42, fontSize: 11, fontFace: BY, color: C.muted, align: 'center', margin: 0, autoFit: false, fit: 'none' }); });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.35, w: 0.06, h: 0.7, fill: { color: C.accent }, line: { type: 'none' } });
  s.addText('浏览器/curl → POST /chat → 医疗专家模型 → 返回医学回答；/health 返回状态、设备(cuda)、显存，作为部署成功依据。', { x: 0.75, y: 4.35, w: 8.6, h: 0.7, fontSize: 13, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none', lineSpacingMultiple: 1.2 });
  footer(s, '05 效果验证与部署');
})();

// ================= S16 界面化部署 =================
(() => { const s = newLight(); header(s, '界面化部署：可视化 Web 界面（真实运行截图）');
  const base = path.join(__dirname, 'assets');
  // 左：/chat 真实界面截图（含流式医学回答）
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.12, w: 5.8, h: 3.6, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.primary, width: 1.2 } });
  s.addText('/chat · 医疗咨询（SSE 流式回答）', { x: 0.62, y: 1.2, w: 5.5, h: 0.3, fontSize: 12, fontFace: ST, color: C.primary, bold: true, margin: 0 });
  s.addImage(imgFit(path.join(base, 'chat_1500x1000.png'), 0.62, 1.58, 5.56, 2.78, 5.56, 2.78));
  s.addText('患者提问 → 医疗专家结构化作答，实时回显', { x: 0.62, y: 4.4, w: 5.56, h: 0.26, fontSize: 10, fontFace: BY, color: C.muted, align: 'center', margin: 0 });
  // 右：/health 真实界面截图 + 关键数据解读
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.5, y: 1.12, w: 3.5, h: 3.6, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line } });
  s.addText('/health · 健康检查（部署凭据）', { x: 6.62, y: 1.2, w: 3.3, h: 0.3, fontSize: 12, fontFace: ST, color: C.primary, bold: true, margin: 0 });
  s.addImage(imgFit(path.join(base, 'health_1500x1000.png'), 6.62, 1.58, 3.26, 1.55, 3.26, 1.55));
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.62, y: 3.26, w: 3.26, h: 1.34, rectRadius: 0.06, fill: { color: C.bg }, line: { color: C.line } });
  [['status', 'ok · 服务在线'], ['device', 'cuda:0 · GPU 推理'], ['显存', '3.3 / 3.4 GiB'], ['model', '…-1.5B-Medical']].forEach((r, i) => { const y = 3.32 + i * 0.32;
    s.addText(r[0] + '：', { x: 6.7, y, w: 1.0, h: 0.26, fontSize: 10.5, fontFace: BY, color: C.muted, margin: 0 });
    s.addText(r[1], { x: 7.75, y, w: 2.1, h: 0.26, fontSize: 10.5, fontFace: BY, color: C.dark2, bold: true, align: 'right', margin: 0, autoFit: false, fit: 'none' }); });
  s.addText('现场演示：访问 http://127.0.0.1:8001/ ，输入问题即流式回显；支持推荐问题、清空对话。', { x: 0.5, y: 4.88, w: 9.0, h: 0.28, fontSize: 11.5, fontFace: BY, color: C.muted, align: 'center', margin: 0 });
  footer(s, '05 效果验证与部署');
})();

// ================= S17 总结成果 =================
(() => { const s = newLight(); header(s, '总结：项目成果与调优');
  const ach = ['完整跑通 数据→训练→合并→验证→部署 全流程', '训练 / 验证损失同步收敛，无明显过拟合', '微调后回答结构清晰、医学术语规范（风格模仿见效）', '落地可用的 FastAPI 接口与可视化 Web 服务'];
  ach.forEach((a, i) => { const y = 1.5 + i * 0.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 5.0, h: 0.5, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line } });
    s.addShape(pres.shapes.OVAL, { x: 0.72, y: y + 0.17, w: 0.16, h: 0.16, fill: { color: C.primary }, line: { type: 'none' } });
    s.addText(a, { x: 1.02, y: y + 0.08, w: 4.4, h: 0.34, fontSize: 12, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none' }); });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.8, y: 1.5, w: 0.03, h: 2.5, fill: { color: C.line }, line: { type: 'none' } });
  s.addText('调优方向', { x: 6.1, y: 1.5, w: 2.5, h: 0.4, fontSize: 15, fontFace: ST, color: C.text, bold: true, margin: 0 });
  [['数据量', '同一病症多用问法、扩充专业分科'], ['模型规模', '升级 7B/8B 基座，提升诊断准确度'], ['超参数', '调 r / α、学习率、epoch 精细优化']].forEach((t, i) => { const y = 2.05 + i * 0.62;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.1, y, w: 0.12, h: 0.12, fill: { color: C.accent }, line: { type: 'none' } });
    s.addText(t[0], { x: 6.35, y: y - 0.08, w: 1.0, h: 0.4, fontSize: 13, fontFace: ST, color: C.primary, bold: true, margin: 0 });
    s.addText(t[1], { x: 7.35, y: y - 0.08, w: 2.1, h: 0.4, fontSize: 11.5, fontFace: BY, color: C.text, align: 'left', margin: 0, autoFit: false, fit: 'none' }); });
  footer(s, '06 总结与展望');
})();

// ================= S18 价值与展望 =================
(() => { const s = newLight(); header(s, '价值与展望');
  const rows = [['7×24 智能应答', '秒级响应急诊咨询，缓解高峰压力'], ['医生端辅助', '跨学科病例分析、诊疗参考支撑'], ['机构端知识复用', '经验固化、知识库集成，降低流失']];
  rows.forEach((r, i) => { const x = 0.5 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.45, w: 2.9, h: 2.3, rectRadius: 0.1, fill: { color: C.card }, line: { color: C.line } });
    s.addText('✓', { x: x + 0.2, y: 1.7, w: 2.5, h: 0.6, fontSize: 28, fontFace: ST, color: C.primary, bold: true, align: 'center', margin: 0 });
    s.addText(r[0], { x: x + 0.2, y: 2.4, w: 2.5, h: 0.4, fontSize: 15, fontFace: ST, color: C.text, bold: true, align: 'center', margin: 0 });
    s.addText(r[1], { x: x + 0.3, y: 2.85, w: 2.3, h: 0.6, fontSize: 11.5, fontFace: BY, color: C.muted, align: 'center', margin: 0, autoFit: false, fit: 'none' }); });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.2, w: 9.0, h: 0.72, rectRadius: 0.1, fill: { color: C.dark }, line: { type: 'none' } });
  s.addText('本模型仅供学习与教学演示，输出不能替代专业医生诊断。生产落地需更大基座 + 医学验证 + 合规审查。', { x: 0.8, y: 4.32, w: 8.4, h: 0.5, fontSize: 13, fontFace: BY, color: 'CFE8E4', align: 'center', margin: 0, autoFit: false, fit: 'none' });
  footer(s, '06 总结与展望');
})();

// ================= S19 结尾 =================
(() => { PAGE++; const s = pres.addSlide(); s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: SH - 0.16, w: SW, h: 0.16, fill: { color: C.primary }, line: { type: 'none' } });
  s.addText('谢谢聆听', { x: 1, y: 2.0, w: 8, h: 1.2, fontFace: ST, fontSize: 56, color: 'FFFFFF', bold: true, charSpacing: 4, align: 'center', margin: 0 });
  s.addText('感谢各位老师与同学的指导', { x: 1, y: 3.4, w: 8, h: 0.6, fontFace: BY, fontSize: 16, color: 'CFE8E4', align: 'center', margin: 0 });
})();

// ===== 输出 =====
const OUT = path.join(__dirname, 'DeepSeek医疗专家模型汇报.pptx');
pres.writeFile({ fileName: OUT }).then(() => console.log('OK: ' + OUT)).catch(e => { console.error(e); process.exit(1); });