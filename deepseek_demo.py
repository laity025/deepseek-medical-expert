"""
DeepSeek 医疗专家 · 现场演示脚本（方案 B：快速稳定版）

优化点（相对 deepseek_val.py）：
1. 只加载「合并后的医疗模型」，不再同时加载两个模型 → 加载快、显存省、耗时短
2. 生成长度 max_new_tokens 从 1024 压缩到 256 → 单题几秒出结果
3. 保持单题演示，控制现场时间

用法：python deepseek_demo.py
"""

import torch
import time
from transformers import AutoModelForCausalLM, AutoTokenizer

# 直接加载合并后的医疗专家模型（由 deepseek_merge.py 生成）
MEDICAL_DIR = "./deepseek/DeepSeek-R1-Distill-Qwen-1.5B-Medical"

start = time.time()
print("加载医疗专家模型...")
tokenizer = AutoTokenizer.from_pretrained(
    MEDICAL_DIR,
    use_fast=False,
    trust_remote_code=True,
)
model = AutoModelForCausalLM.from_pretrained(
    MEDICAL_DIR,
    device_map="auto",
    torch_dtype="auto",
)
print(f"模型加载完成，耗时 {time.time()-start:.1f} 秒")


def chat(question, max_new_tokens=300, temperature=0.4, repetition_penalty=1.1):
    """
    对医疗问题生成回答，返回最终生成文本。
    演示题选用开放式常见病咨询，突出微调后能给出规范、在理的医疗建议。
    注：低温度 + 长度惩罚可抑制 1.5B 模型的漫谈/重复，让输出更清晰。
    """
    messages = [
        {"role": "user", "content": question},
        {"role": "system",
         "content": "你是专业的医疗领域专家，具备扎实的医学知识和严谨的临床推理能力，请结合医学专业背景回答以下问题。"},
    ]
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

    gen_start = time.time()
    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=max_new_tokens,
        do_sample=True,
        temperature=temperature,
        repetition_penalty=repetition_penalty,
    )
    output_ids = generated_ids[0][len(model_inputs.input_ids[0]):].tolist()
    content = tokenizer.decode(output_ids, skip_special_tokens=True).strip("\n")
    print(f"生成耗时 {time.time()-gen_start:.1f} 秒")
    return content


if __name__ == "__main__":
    # 现场演示题目（筛选自探针，规范可答对；可按需增删）
    demo_questions = [
        "2型糖尿病患者在日常生活中，饮食控制和运动方面有哪些建议？",
        "一位高血压患者平时血压控制良好，请问生活方式上应该注意哪些事项？",
        "体检发现轻度脂肪肝，无特殊不适，应该如何调整生活方式？",
    ]
    print("=" * 70)
    print("现场演示：DeepSeek-R1-Distill-Qwen-1.5B 医疗专家（LoRA 微调）")
    print("=" * 70)
    for q in demo_questions:
        print("【问题】", q)
        print("-" * 70)
        print("【医疗专家回答】")
        try:
            answer = chat(q)
            print(answer)
        except Exception as e:
            print("(生成失败:)", e)
        print("-" * 70)
    print("=" * 70)
    print(f"全程总耗时 {time.time()-start:.1f} 秒")