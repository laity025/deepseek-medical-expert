"""
本代码为 DeepSeek 医疗专家模型推理脚本
用于验证未微调前模型对医疗问题的回答效果，熟悉模型输入输出结构
"""

from modelscope import snapshot_download, AutoTokenizer
from transformers import AutoModelForCausalLM
import torch

# 在 modelscope 上下载 DeepSeek 模型到本地目录下
model_dir = snapshot_download(
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
    local_dir="./deepseek/DeepSeek-R1-Distill-Qwen-1.5B",
    revision="master"
)

# 加载模型和分词器
tokenizer = AutoTokenizer.from_pretrained(
    model_dir,
    use_fast=False,
    trust_remote_code=True,
)
model = AutoModelForCausalLM.from_pretrained(
    model_dir,
    device_map="auto",
    torch_dtype="auto",
)

# 构造一个医疗问题（示例）
prompt = "小孩夏天头皮上长结节，中医怎么治疗？"
messages = [
    {"role": "user", "content": prompt},
]

# 把消息映射到提示模版（DeepSeek-R1-Distill 使用 Qwen2.5 风格模板）
text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True,
)

# 通过分词器将文本转换成模型输入，包含 input_ids / attention_mask
model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

# 模型生成答案，答案形式为数字 ID，包含原始问题 + 答案
generated_ids = model.generate(
    **model_inputs,
    temperature=0.7,
    top_p=0.8,
    top_k=20,
    min_p=0,
    max_new_tokens=32768,
)

# 将原始问题从答案中剥离，只保留生成的答案部分
output_ids = generated_ids[0][len(model_inputs.input_ids[0]):].tolist()
content = tokenizer.decode(output_ids, skip_special_tokens=True).strip("\n")

print("=" * 60)
print("【模型输出】")
print(content)
print("=" * 60)

# 提示：DeepSeek-R1-Distill 会输出较长的思考过程后再给结论。
# 如需把思考过程与最终答案分开展示，可根据实际输出中的分隔标志（如换行后直接跟答案）
# 自行调整下面的分割逻辑。
# split_idx = content.find("\n\n")
# if split_idx != -1:
#     print("【思考过程】", content[:split_idx])
#     print("【最终答案】", content[split_idx:])