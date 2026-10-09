"""
本代码为 DeepSeek 医疗专家模型微调脚本（参照 qwen3_wt / qwen_train.py 改造）

主要改动（相对 qwen3_wt 原版）：
1. 将基座模型由 Qwen/Qwen3-0.6B 替换为 deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B；
2. 移除 Qwen3 特有的 enable_thinking 参数（DeepSeek-R1-Distill 基于 Qwen2.5 模板，无需该参数）；
3. 数据源改为 ./data 目录下由 data_process.py 生成的医疗训练集 train.jsonl / 验证集 val.jsonl；
4. 针对 1.5B 模型与 8GB 显存，调低训练轮数并保留 batch=1 的显存友好配置。

微调流程：
1. 下载、加载 DeepSeek 模型
2. 数据格式转换，得到 input_ids（问题与角色设置） attention_mask（全 1） labels（标准答案）
3. LoRA 参数设置
4. 微调参数设置、微调
"""

import torch
from datasets import Dataset
from modelscope import snapshot_download, AutoTokenizer
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForSeq2Seq


# 在 modelscope 上下载 DeepSeek 模型到本地目录下
model_dir = snapshot_download(
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
    local_dir="./deepseek/DeepSeek-R1-Distill-Qwen-1.5B",
    revision="master",
)

# 加载模型和分词器
# DeepSeek-R1-Distill-Qwen-1.5B 模型体积约 3GB（FP16），RTX 4060 8GB 显存可正常加载
tokenizer = AutoTokenizer.from_pretrained(
    model_dir,
    use_fast=False,
    trust_remote_code=True,
    do_sample=True,
    temperature=0.6,
    top_p=0.95,
    top_k=20,
)
model = AutoModelForCausalLM.from_pretrained(
    model_dir,
    device_map="auto",
    torch_dtype="auto",
)
# 开启梯度检查点时，需执行该方法表示开启训练；同时确保 LoRA 仅对部分参数求梯度
model.enable_input_require_grads()

# 加载、处理数据集和测试集（由 data_process.py 生成到 ./dataset 目录）
train_dataset_path = "./dataset/train.jsonl"
test_dataset_path = "./dataset/val.jsonl"

# 得到训练集
train_ds = Dataset.from_json(train_dataset_path)
for i in train_ds:
    print(i)
    break

# 文本最大长度
# data_process.py 已截断超长思考链并完整保留答案，此处可适当降低以加快训练
MAX_LENGTH = 1280


def process_func(example):
    """
    将数据集进行预处理，example 为一条数据：{"input":..., "output":..., "instruction":...}
    """
    # 消息构造：用户问题 + 系统角色设置
    messages = [
        {"role": "user", "content": example["input"]},
        {"role": "system", "content": example["instruction"]},
    ]
    # 将消息映射到提示模版（DeepSeek-R1-Distill 使用 Qwen2.5 风格模板）
    # 注意：不对分词器传入 enable_thinking，DeepSeek 推理时自带思考链
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    # 通过分词器将文本转换成模型输入，包含 input_ids / attention_mask
    inputs = tokenizer(str(text), add_special_tokens=False).to(model.device)
    # 将标准答案（含思考链 + 答案）转为模型输入
    response = tokenizer(example["output"], add_special_tokens=False)
    # input_ids 添加结束标记 pad_token_id
    input_ids = inputs["input_ids"] + response["input_ids"] + [tokenizer.pad_token_id]
    # attention_mask 添加结束标记 1
    attention_mask = inputs["attention_mask"] + response["attention_mask"] + [1]
    # 构建标签：标签为标准答案
    # 大模型生成结果时以"原始问题+答案"形式输出，为保证长度一致，
    # 在标准答案前添加与原始问题长度相同的多个 -100（-100 表示不参与损失计算）
    labels = [-100] * len(inputs["input_ids"]) + response["input_ids"] + [tokenizer.pad_token_id]
    # 若超出设定最大长度，则截断输入和标签
    if len(input_ids) > MAX_LENGTH:
        input_ids = input_ids[:MAX_LENGTH]
        attention_mask = attention_mask[:MAX_LENGTH]
        labels = labels[:MAX_LENGTH]
    # 返回大模型要接受的 3 个参数：input_ids, attention_mask, labels
    return {"input_ids": input_ids, "attention_mask": attention_mask, "labels": labels}


# 处理训练数据集，并删除原始的文本字段
train_dataset = train_ds.map(process_func, remove_columns=["input", "output", "instruction"])
train_dataset = train_dataset.shuffle(seed=42)
for i in train_dataset:
    print(i)
    break

# 处理验证数据集，并删除原始的文本字段
val_ds = Dataset.from_json(test_dataset_path)
val_dataset = val_ds.map(process_func, remove_columns=["input", "output", "instruction"])
for i in val_dataset:
    print(i)
    break

## LoRA 微调配置
from peft import LoraConfig, TaskType, get_peft_model

config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,        # 任务类型：因果语言模型
    inference_mode=False,                # 是否启用推理模式（训练时设为 False）
    r=16,                                # 低秩矩阵维数（提至 16：增大 LoRA 容量，医学知识学得更深；8GB 显存仍足够）
    lora_alpha=32,                       # 低秩矩阵缩放系数（与 r=16 配套，alpha=2r 是常见设定）
    lora_dropout=0.05,                   # LoRA 层丢弃率，取值范围 [0, 1)
    # DeepSeek-R1-Distill-Qwen 基于 Qwen2.5 架构，target_modules 与之兼容
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
)
# 将模型包装为 LoRA 微调模型
model = get_peft_model(model, config)

# 微调参数设置
training_args = TrainingArguments(
    output_dir="./output",              # 结果保存目录
    num_train_epochs=2,                 # 训练轮数（1000 条 × 2 epoch ≈ 500 步，1 小时内收敛更充分）
    eval_strategy="steps",              # 验证策略：steps
    eval_steps=50,                      # 每多少步验证一次（500 步训练可看到多次验证）
    learning_rate=5e-5,                 # 学习率（原 1e-4，略微调低以缓解训练损失震荡）
    per_device_train_batch_size=1,      # 每个设备训练批大小（8GB 显存下建议为 1）
    per_device_eval_batch_size=1,       # 每个设备评估批大小
    gradient_accumulation_steps=4,      # 梯度累积步数：等效 batch=4，显著降低单样本梯度噪声、稳定训练
    warmup_steps=10,                    # 预热步数
    weight_decay=0.02,                  # 权重衰减（增强正则化，从 0.01 提到 0.02）
    logging_strategy="steps",           # 日志策略：steps
    logging_steps=10,                   # 每多少步打印日志
    save_steps=25,                      # 每多少步保存模型（500 步训练约有 20 个保存点）
    save_total_limit=2,                 # 最多保存的 checkpoint 数量
    report_to="none",                   # 不使用报告
    use_cpu=False,                      # False 表示使用 GPU 训练
)

# 构建训练器
trainer = Trainer(
    model=model,                                   # 模型
    args=training_args,                            # 训练参数
    train_dataset=train_dataset,                   # 训练数据集
    eval_dataset=val_dataset,                      # 验证数据集
    data_collator=DataCollatorForSeq2Seq(tokenizer=tokenizer, padding=True),  # 数据处理器
)

# 执行训练
trainer.train()

# 模型效果改进建议（供后续调优参考）：
# 1. 数据量增加：同一病症用不同描述提问；或使用不同模型生成更多问答对；
# 2. 模型参数增加：换用更大的参数规模模型（如 7B / 8B），或升级到更好基座；
# 3. 修改微调参数（r、lora_alpha、学习率、epoch 等）以改善效果。