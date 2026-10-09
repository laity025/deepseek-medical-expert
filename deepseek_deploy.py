"""
DeepSeek 医疗专家模型部署脚本（FastAPI 推理服务）
功能：将微调并合并后的"医疗专家模型"封装为 HTTP 服务，
满足 PPT 汇报要求中"环境准备 → 结果验证 → 部署"的完整闭环。
用户通过 POST 请求提交医疗问题，服务返回模型生成的医学回答。

启动方式（需先激活 deploy 虚拟环境，并完成模型合并）：
    python deepseek_deploy.py
或指定端口：
    uvicorn deepseek_deploy:app --host 0.0.0.0 --port 8000

本地测试：
    curl -X POST http://127.0.0.1:8000/chat -H "Content-Type: application/json" -d "{\"question\":\"小孩夏季头皮长结节如何辨证\"}"
"""

import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer

# 合并后医疗专家模型路径（由 deepseek_merge.py 生成）
MODEL_DIR = "./deepseek/DeepSeek-R1-Distill-Qwen-1.5B-Medical"

# 医疗专家系统提示词（与训练时 instruction 保持一致，保证部署效果稳定）
SYSTEM_PROMPT = "你是专业的医疗领域专家，具备扎实的医学知识和严谨的临床推理能力，请结合医学专业背景回答以下问题。"

# 创建 FastAPI 应用
app = FastAPI(title="DeepSeek 医疗专家模型服务", version="1.0.0")

# 全局加载模型与分词器（服务启动时只加载一次，提高响应速度）
def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, use_fast=False, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(MODEL_DIR, device_map="auto", torch_dtype="auto")
    model.eval()  # 切换到推理模式
    return tokenizer, model

tokenizer, model = load_model()


class ChatRequest(BaseModel):
    """请求体：用户提交的医疗问题"""
    question: str


class ChatResponse(BaseModel):
    """响应体：模型生成的医学回答"""
    answer: str


def generate_answer(question: str) -> str:
    """
    根据用户问题生成医学回答。
    构造消息 → 应用到聊天模板 → 模型生成 → 剥离输入前缀返回答案。
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    # 将消息映射到提示模版
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():  # 推理阶段关闭梯度，节省显存
        generated_ids = model.generate(
            **model_inputs,
            max_new_tokens=1024,  # 限制输出长度，避免 1.5B 模型长文本胡言乱语
            temperature=0.4,      # 低温采样，输出更稳定
            repetition_penalty=1.1,  # 抑制循环重复（1.5B 模型必需）
            top_p=0.8,
            do_sample=True,
        )

    # 剥离输入部分，只保留生成的答案
    output_ids = generated_ids[0][len(model_inputs.input_ids[0]):].tolist()
    return tokenizer.decode(output_ids, skip_special_tokens=True).strip()


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """POST /chat 接口：接收问题，返回医学回答"""
    answer = generate_answer(req.question)
    return ChatResponse(answer=answer)


@app.get("/health")
def health():
    """健康检查接口：返回服务运行状态与设备信息"""
    return {"status": "ok", "model": MODEL_DIR, "device": str(model.device)}


if __name__ == "__main__":
    import uvicorn

    def _link(url: str, label: str) -> str:
        # ANSI OSC8 超链接：Windows Terminal / VS Code 终端可直接鼠标点击
        return f"\u001b]8;;{url}\u001b\\{label}\u001b]8;;\u001b\\"

    # 启动横幅：打印可点击的访问地址（纯 API 服务，主入口指向接口文档 /docs）
    print("\n" + "=" * 52)
    print("  DeepSeek 医疗专家服务已启动")
    print("  " + _link("http://127.0.0.1:8000/docs", "→ 打开接口文档  http://127.0.0.1:8000/docs"))
    print("  " + _link("http://127.0.0.1:8000/health", "→ 健康检查      http://127.0.0.1:8000/health"))
    print("  界面化部署（独立端口 8001）请运行：python deepseek_deploy_ui.py")
    print("  局域网访问：请使用本机 IP，例如 http://192.168.x.x:8000")
    print("=" * 52 + "\n")

    # 启动 HTTP 服务：0.0.0.0 表示监听所有网卡，便于局域网内其他成员访问
    uvicorn.run(app, host="0.0.0.0", port=8000)