"""
医疗问答数据格式转换脚本
功能：将医疗开源原始数据 medical_cot_zh.jsonl（每条含 Question / Complex_CoT / Response 三个字段）
转换为 PEFT 微调所需的 {"input", "output", "instruction"} 三字段 JSONL 格式。

输入文件字段说明（medical_cot_zh.jsonl 每行一个 JSON 对象）：
    Question     : 患者提问或症状描述（作为模型输入 input）
    Complex_CoT  : 医学思考过程（作为模型需要模仿的推理内容）
    Response     : 最终医学答案

输出文件字段说明：
    input       : Question，作为 user 用户问题
    output      : Complex_CoT + "\n" + Response，作为模型要学习生成的标准答案（含思考链）
    instruction : 系统角色设定，作为 system 系统提示

本脚本将数据按比例随机划分为训练集 train.jsonl 与验证集 val.jsonl，
并输出到 ./data 目录，供训练脚本 deepseek_train.py 使用。
"""

import json
import random
import os

# 原始医疗数据文件路径（数据放在项目 data 目录下）
SRC_FILE = "./data/medical_cot_zh.jsonl"

# 输出目录（独立存放，避免与原始数据目录混用）
DATA_DIR = "./dataset"
TRAIN_FILE = os.path.join(DATA_DIR, "train.jsonl")
VAL_FILE = os.path.join(DATA_DIR, "val.jsonl")

# 验证集占比（本项目按 9:1 划分训练与验证）
VAL_RATIO = 0.1

# 训练集抽样上限：只取前 N 条作为训练集，控制训练时长（1000 条 + 2 epoch ≈ 500 步，1 小时内）
# 设 None 表示使用全部数据
TRAIN_COUNT = 1000

# 思考链最长字符数：medical_cot_zh.jsonl 中 Complex_CoT 通常很长，会拖慢训练
# 超长思考链将被截断，但最终答案 Response 会完整保留（答案在 output 末尾，不能丢）
# 调低至 600：缩短序列长度，加快单步训练，让模型聚焦答案而非冗长思考
MAX_COT_CHARS = 600

# 验证集抽样上限：只取前 N 条作为验证集（验证集够看趋势即可，不宜过大拖慢训练节奏）
VAL_COUNT = 100

# 随机种子，保证划分结果可复现
SEED = 42

# 医疗专家系统提示词（对应参考代码中的 instruction 角色设定）
MEDICAL_INSTRUCTION = (
    "你是专业的医疗领域专家，具备扎实的医学知识和严谨的临床推理能力，"
    "请结合医学专业背景，仔细分析患者的提问与症状描述，给出规范、准确的医疗建议。"
)


def load_raw_data(src_file):
    """
    读取原始医疗问答 JSONL 数据。
    返回样本列表，每项为 {"Question":..., "Complex_CoT":..., "Response":...}。
    过滤掉缺少关键字段的异常行。
    """
    samples = []
    with open(src_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                print(f"跳过无法解析的行: {line[:100]}")
                continue
            # 仅保留包含核心字段的样本
            if all(key in obj for key in ("Question", "Complex_CoT", "Response")):
                samples.append(obj)
            else:
                print(f"跳过缺少字段的样本: {list(obj.keys())}")
    return samples


def to_train_format(sample):
    """
    将原始样本映射为微调所需的三字段格式。
    output 由思考过程 + 答案拼接，使模型能学习到"先思考后回答"的医学推理模式。
    为避免超长思考链拖慢训练，对 thinking 部分按 MAX_COT_CHARS 截断，
    但完整的最终答案 Response 始终保留在末尾。
    """
    question = sample["Question"].strip()
    complex_cot = sample["Complex_CoT"].strip()
    response = sample["Response"].strip()
    # 截断思考链（若超长取开头部分，答案不动）
    if len(complex_cot) > MAX_COT_CHARS:
        complex_cot = complex_cot[:MAX_COT_CHARS]
    output = f"{complex_cot}\n{response}"
    return {"input": question, "output": output, "instruction": MEDICAL_INSTRUCTION}


def write_jsonl(file_path, items):
    """将字典列表按行写入 JSONL 文件。"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    # 1. 读取原始数据
    print("读取原始医疗数据...")
    raw_samples = load_raw_data(SRC_FILE)
    print(f"原始样本总数: {len(raw_samples)}")

    if not raw_samples:
        print("未读取到有效数据，请检查 medical_cot_zh.jsonl 是否存在于本目录。")
        exit(1)

    # 2. 转换为训练格式
    formatted = [to_train_format(s) for s in raw_samples]

    # 3. 随机打乱并划分训练集 / 验证集
    random.seed(SEED)
    random.shuffle(formatted)
    val_count = max(1, int(len(formatted) * VAL_RATIO))
    val_items = formatted[:val_count]
    train_items = formatted[val_count:]

    # 4. 分别对训练集、验证集按上限抽样，控制训练与验证时长
    if TRAIN_COUNT is not None and len(train_items) > TRAIN_COUNT:
        train_items = train_items[:TRAIN_COUNT]
    if val_count > VAL_COUNT:
        val_items = val_items[:VAL_COUNT]

    # 5. 写入输出文件
    write_jsonl(TRAIN_FILE, train_items)
    write_jsonl(VAL_FILE, val_items)

    print(f"训练集样本数: {len(train_items)} -> {TRAIN_FILE}")
    print(f"验证集样本数: {len(val_items)} -> {VAL_FILE}")

    # 6. 打印一条样例以便人工核对格式
    print("\n训练集样例:")
    print(json.dumps(train_items[0], ensure_ascii=False, indent=2))