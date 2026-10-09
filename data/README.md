# 数据目录说明

> 本仓库**不包含**原始数据集（体积约 170MB，超出 GitHub 合理的仓库体积）。
> `data_process.py` 读取的原始文件需自行放到本目录下。

## 需要放置的文件

| 文件名 | 体积 | 用途 | 是否必需 |
| --- | --- | --- | --- |
| `medical_cot_zh.jsonl` | ≈ 50 MB | **主数据**：中文医学思维链问答，约 2 万条 | ✅ 必需（训练与验证都用它） |
| `medical_alpaca.json` | ≈ 60 MB | 备选：Alpaca 格式医疗指令数据 | ⬜ 可选 |
| `medical_sharegpt.json` | ≈ 63 MB | 备选：ShareGPT 格式多轮医疗对话 | ⬜ 可选 |

## 获取途径

`medical_cot_zh.jsonl` 的字段结构（`Question` / `Complex_CoT` / `Response`）与开源数据集
**[FreedomIntelligence/medical-o1-reasoning-SFT](https://huggingface.co/datasets/FreedomIntelligence/medical-o1-reasoning-SFT)**（Apache-2.0，含中英双子集）一致：

```python
# 方式一：HuggingFace datasets
from datasets import load_dataset
ds = load_dataset("FreedomIntelligence/medical-o1-reasoning-SFT", "zh", split="train")
# 导出为 jsonl 后重命名为 medical_cot_zh.jsonl 放入本目录

# 方式二：直接从 HuggingFace 仓库下载对应的 .json 文件，转换/重命名后放入本目录
```

## 原始数据的字段格式（每行一个 JSON 对象）

```json
{
  "Question": "患者提问 / 症状描述",
  "Complex_CoT": "医学思考过程（思维链）",
  "Response": "最终医学答案"
}
```

`data_process.py` 会把它转换为微调所需的**三字段格式**，并输出到 `dataset/`：

```json
{
  "input": "Question（用户问题）",
  "output": "Complex_CoT + Response（含思考链的标准答案，思考链按 MAX_COT_CHARS 截断）",
  "instruction": "你是专业的医疗领域专家……（系统角色设定）"
}
```

> `dataset/train.jsonl`（1000 条）与 `dataset/val.jsonl`（100 条）**已随仓库提交**，
> 因此即使不下载原始数据，也可以直接开始 LoRA 微调：`python deepseek_train.py`。
