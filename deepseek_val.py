"""
本代码为 DeepSeek 医疗专家模型验证脚本（教学/演示版 · 风格模仿模式）

用途说明：
本项目基座模型为 1.5B 小参数模型，LoRA 微调达成的是「领域风格模仿」——
即让模型学会医疗专家式的表达、用语与回答结构，而非追求诊断绝对准确。

因此本脚本的演示重点，是对同一道开放式医疗咨询问题，
对比「微调前（原始基座）」与「微调后（合并模型）」的回答风格差异，
用于教学展示「微调能让模型掌握领域表达范式」。

演示时刻意选用开放式问诊问题，不设标准答案对照，引导观众关注回答的
「结构与语态」，而非评判医学结论正误。

运行方式：
    python deepseek_val.py
对比结果会打印到终端，并同时保存一份带时间戳的存档文件（便于截图留档）。
"""

import os
import time
import datetime
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# 原始基座模型 / 合并后的医疗专家模型（由 deepseek_merge.py 生成）
BASE_DIR = "./deepseek/DeepSeek-R1-Distill-Qwen-1.5B"
MEDICAL_DIR = "./deepseek/DeepSeek-R1-Distill-Qwen-1.5B-Medical"

# 医疗专家系统提示词（与训练/部署保持一致）
SYSTEM_PROMPT = "你是专业的医疗领域专家，具备扎实的医学知识和严谨的临床推理能力，请结合医学专业背景回答以下问题。"

# 生成参数：低温 + 长度惩罚 + 限长，抑制 1.5B 模型漫谈/重复（与 demo/deploy 保持一致）
GEN_KWARGS = dict(
    max_new_tokens=1024,
    do_sample=True,
    temperature=0.4,
    repetition_penalty=1.1,
)

# 演示题：开放式常见病咨询（糖尿病/高血压等训练数据覆盖多的题），突出表达范式差异
DEMO_QUESTIONS = [
    "2型糖尿病患者在日常生活中，饮食控制和运动方面有哪些建议？",
]


def load_model(path):
    """按需加载模型（一次只驻留一个，避免两个完整模型同时占满 8GB 显存触发 offload）"""
    tokenizer = AutoTokenizer.from_pretrained(path, use_fast=False, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(path, device_map="auto", torch_dtype="auto")
    return tokenizer, model


def generate(question, model, tokenizer):
    """对给定模型生成回答，剥离输入前缀只返回答案文本"""
    messages = [
        {"role": "user", "content": question},
        {"role": "system", "content": SYSTEM_PROMPT},
    ]
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

    generated_ids = model.generate(**model_inputs, **GEN_KWARGS)
    output_ids = generated_ids[0][len(model_inputs.input_ids[0]):].tolist()
    return tokenizer.decode(output_ids, skip_special_tokens=True).strip("\n")


def run():
    print("=" * 70)
    print("教学演示：微调让模型学会「医疗专家式」表达与规范诊治")
    print("说明：模型逐个加载以避免 8GB 显存不足，请耐心等待")
    print("=" * 70)

    lines = []  # 存档行缓存
    def log(text=""):
        print(text)
        lines.append(text)

    for q in DEMO_QUESTIONS:
        log(f"【问题】{q}")
        log("-" * 70)

        # ---- 微调前：加载原始基座并推理 ----
        log("【微调前 · 原始基座回答】（正在加载基座模型…）")
        tokenizer_b, model_b = load_model(BASE_DIR)
        try:
            before = generate(q, model_b, tokenizer_b)
            log(before)
        except Exception as e:
            log(f"(生成失败: {e})")
        # 释放显存，避免与微调后模型叠加占用
        del model_b, tokenizer_b
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        log("-" * 70)

        # ---- 微调后：加载合并好的医疗专家模型并推理 ----
        log("【微调后 · 医疗专家回答】（正在加载合并模型…）")
        tokenizer_a, model_a = load_model(MEDICAL_DIR)
        try:
            after = generate(q, model_a, tokenizer_a)
            log(after)
        except Exception as e:
            log(f"(生成失败: {e})")
        del model_a, tokenizer_a
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        log("=" * 70)

    # 保存对比结果存档（便于截图留档）
    os.makedirs("./output", exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    save_path = os.path.join("./output", f"val_compare_{ts}.txt")
    with open(save_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n对比结果已存档: {save_path}")


if __name__ == "__main__":
    start = time.time()
    run()
    print(f"全程总耗时 {time.time()-start:.1f} 秒")