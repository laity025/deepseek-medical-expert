"""
本代码为 DeepSeek 医疗专家模型合并脚本（参照 qwen3_wt / qwen_merge.py 改造）
功能：将原始模型与微调后的 LoRA 权重合并，得到可直接部署的"医疗专家模型"。
合并后推理无需再加载 LoRA 适配器，推理速度更快。
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel, PeftConfig


# 加载原始 DeepSeek 模型的 tokenizer 和 model（使用本地已下载的模型路径）
MODEL_DIR = "./deepseek/DeepSeek-R1-Distill-Qwen-1.5B"
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_DIR,
    use_fast=False,
    trust_remote_code=True,
    temperature=0.7,
    top_p=0.8,
    top_k=20,
    do_sample=True,
)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_DIR,
    device_map="auto",
    torch_dtype="auto",
)

# 加载微调后保存的 LoRA 权重
# 注意：checkpoint 目录需要改为 deepseek_train.py 实际输出的最新 checkpoint
lora_model = PeftModel.from_pretrained(
    model=model,                       # 原始模型
    model_id="output/checkpoint-500",  # 微调后的模型权重（最终完整模型）
)

# 3. 模型合并：将 LoRA 权重合并进原始模型
model_new = lora_model.merge_and_unload()

# 4. 保存合并后的医疗专家模型
model_new.save_pretrained("./deepseek/DeepSeek-R1-Distill-Qwen-1.5B-Medical")
tokenizer.save_pretrained("./deepseek/DeepSeek-R1-Distill-Qwen-1.5B-Medical")
print("医疗专家模型合并保存成功! 保存路径: ./deepseek/DeepSeek-R1-Distill-Qwen-1.5B-Medical")