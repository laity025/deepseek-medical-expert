"""
DeepSeek 模型下载脚本
使用 modelscope 从魔搭社区将 DeepSeek-R1-Distill-Qwen-1.5B 模型下载到本地目录
"""
from modelscope import snapshot_download

# 在 modelscope 上下载 DeepSeek 模型到本地目录下
# 魔搭社区已同步 DeepSeek-R1-Distill 系列模型
model_dir = snapshot_download(
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
    local_dir="./deepseek/DeepSeek-R1-Distill-Qwen-1.5B",
    revision="master"
)

print(f"模型下载完成，保存到: {model_dir}")