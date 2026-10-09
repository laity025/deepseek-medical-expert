"""
读取模型微调时保存的训练状态文件，并将训练过程中的损失指标绘制成曲线。
相对参考实现 qwen3_wt / train_loss_plt.py 的改进：
自动扫描 ./output 目录下最新的含 trainer_state.json 的 checkpoint，无需手动指定路径。
"""

import os
import json
import glob
import datetime
import matplotlib.pyplot as plt


def find_latest_checkpoint(output_dir="./output"):
    """
    自动查找 output 目录下最新的含 trainer_state.json 的 checkpoint 目录。
    按目录名中的数字（step）取最大值，作为最新训练状态。
    """
    state_files = glob.glob(os.path.join(output_dir, "checkpoint-*", "trainer_state.json"))
    if not state_files:
        raise FileNotFoundError(f"未在 {output_dir} 下找到 trainer_state.json，请先完成模型微调。")
    # 从文件路径提取 checkpoint 编号
    def step_of(f):
        base = os.path.basename(os.path.dirname(f))
        try:
            return int(base.split("-")[-1])
        except ValueError:
            return 0

    return max(state_files, key=step_of)


# 定位最新训练状态文件
state_file = find_latest_checkpoint()
print(f"使用训练状态文件: {state_file}")

# 读取训练状态文件
with open(state_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# 提取训练日志
log_history = data["log_history"]

# 分离训练和验证数据
train_loss = [entry["loss"] for entry in log_history if "loss" in entry]
train_steps = [entry["step"] for entry in log_history if "loss" in entry]

eval_loss = [entry["eval_loss"] for entry in log_history if "eval_loss" in entry]
eval_steps = [entry["step"] for entry in log_history if "eval_loss" in entry]

# 绘制双曲线
plt.figure(figsize=(10, 6))
plt.plot(train_steps, train_loss, "b-", label="Train Loss")
plt.plot(eval_steps, eval_loss, "orange", marker="o", linestyle="-", label="Eval Loss")

# 图表装饰
plt.title("Training & Validation Loss")
plt.xlabel("Training Steps")
plt.ylabel("Loss")
plt.grid(True)
plt.legend()

# 将图片保存到项目文件夹内的 ./output 目录（带时间戳，避免多次运行相互覆盖）
save_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(save_dir, exist_ok=True)
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
save_path = os.path.join(save_dir, f"train_val_loss_{timestamp}.png")
plt.savefig(save_path, dpi=200, bbox_inches="tight")
print(f"图片已保存至: {save_path}")

# 显示图表
plt.show()