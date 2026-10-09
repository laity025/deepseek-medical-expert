"""
DeepSeek 医疗专家服务 -- 界面化部署脚本
说明：本脚本在原 deepseek_deploy.py 纯 API 服务基础上，额外提供可视化 Web 界面，
复用原脚本已加载的模型与生成函数，不重复推理逻辑（import 时仅加载一次模型）。
界面可供 PPT 演示"部署"环节：浏览器提交问题、界面回显回答，并展示服务状态与显存占用。

启动方式（需先激活 deploy 虚拟环境，并完成模型合并）：
    python deepseek_deploy_ui.py

浏览器访问（独立端口 8001，可与纯 API 服务的 8000 端口同时运行）：
    http://127.0.0.1:8001/          --> 可视化界面（根路径）
    http://127.0.0.1:8001/health   --> 健康检查（含显存占用）
    http://127.0.0.1:8001/docs     --> 接口文档
"""

import json
import os
import queue
import threading
import torch
from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from transformers import TextIteratorStreamer

# 复用原 API 服务的模型、分词器与生成函数（import 时执行 load_model 一次性加载模型）
from deepseek_deploy import SYSTEM_PROMPT, MODEL_DIR, tokenizer, model, generate_answer

# 界面页面路径（本脚本同目录下的 Web 前端）
UI_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "deepseek_ui.html")


class ChatRequest(BaseModel):
    """请求体：用户提交的医疗问题"""
    question: str


class ChatResponse(BaseModel):
    """响应体：模型生成的医学回答"""
    answer: str


# 界面化服务的 FastAPI 应用
app = FastAPI(title="DeepSeek 医疗专家服务（界面化）", version="1.1.0")


@app.get("/", response_class=FileResponse)
def index():
    """根路径：返回可视化界面页面"""
    return FileResponse(UI_FILE)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    """POST /chat 接口：接收问题，一次性返回完整医学回答"""
    answer = generate_answer(req.question)
    return ChatResponse(answer=answer)


def generate_answer_stream(question: str):
    """流式生成：边生成边通过 TextIteratorStreamer 回吐回答文本"""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    # 将消息映射到提示模版
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

    # 流式流：收集生成过程中的 token 并实时解码为文本
    streamer = TextIteratorStreamer(
        tokenizer, skip_prompt=True, skip_special_tokens=True, timeout=120.0
    )
    gen_kwargs = dict(
        **model_inputs,
        max_new_tokens=1024,        # 与纯 API 保持一致
        temperature=0.4,            # 与纯 API 保持一致
        repetition_penalty=1.1,     # 与纯 API 保持一致
        top_p=0.8,
        do_sample=True,
        streamer=streamer,          # 开启流式输出
    )

    # 后台线程执行生成，主线程从 streamer 读取分片
    thread = threading.Thread(target=model.generate, kwargs=gen_kwargs)
    thread.start()
    for chunk in streamer:
        yield chunk


@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    """POST /chat/stream：SSE 流式接口，逐片返回回答文本，供界面逐字显示"""
    def event_stream():
        for chunk in generate_answer_stream(req.question):
            # 每条 SSE 消息携带一个 delta 分片
            yield f"data: {json.dumps({'delta': chunk}, ensure_ascii=False)}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
def health():
    """健康检查接口：返回服务状态、设备信息与显存占用（供界面左侧面板展示）"""
    gpu_info = {}
    if hasattr(model, "device") and "cuda" in str(model.device) and torch.cuda.is_available():
        gpu_info = {
            "allocation": torch.cuda.memory_allocated(0),  # 已分配显存（字节）
            "reserved": torch.cuda.memory_reserved(0),      # 保留显存（字节）
        }
    return {"status": "ok", "model": MODEL_DIR, "device": str(model.device), **gpu_info}


if __name__ == "__main__":
    import uvicorn

    def _link(url, label):
        # ANSI OSC8 超链接：Windows Terminal / VS Code 终端可直接鼠标点击
        return f"\u001b]8;;{url}\u001b\\{label}\u001b]8;;\u001b\\"

    # 启动横幅：打印可点击访问地址（独立端口 8001，避免与纯 API 的 8000 冲突）
    print("\n" + "=" * 52)
    print("  DeepSeek 医疗专家服务（界面化）已启动")
    print("  " + _link("http://127.0.0.1:8001/", "→ 打开可视化界面  http://127.0.0.1:8001/"))
    print("  " + _link("http://127.0.0.1:8001/health", "→ 健康检查        http://127.0.0.1:8001/health"))
    print("  " + _link("http://127.0.0.1:8001/docs", "→ 接口文档        http://127.0.0.1:8001/docs"))
    print("  局域网访问：请使用本机 IP，例如 http://192.168.x.x:8001")
    print("=" * 52 + "\n")

    # 启动 HTTP 服务：0.0.0.0 表示监听所有网卡；端口 8001 与纯 API 服务 8000 区分
    uvicorn.run(app, host="0.0.0.0", port=8001)