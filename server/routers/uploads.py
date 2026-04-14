"""
文件上传路由
用于处理 docx 文件上传和解析
"""
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException

from server.core.config import settings
from server.schemas.contract import DocxUploadParseResult, DocxPlaceholderInfo
from server.services.docx_parser import parse_docx_placeholders

router = APIRouter(prefix="/api/templates", tags=["文件上传"])


def response_success(data=None, message="操作成功"):
    return {"success": True, "message": message, "data": data}


def response_error(message: str, status_code: int = 400):
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "message": message},
    )


def ensure_upload_dir() -> str:
    """确保上传目录存在"""
    upload_dir = getattr(settings, 'UPLOAD_DIR', 'uploads')
    templates_dir = os.path.join(upload_dir, 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    return templates_dir


@router.post("/upload-docx", response_model=dict)
async def upload_docx(file: UploadFile = File(...)):
    """
    上传 docx 文件并解析占位符
    """
    # 校验文件类型
    if not file.filename or not file.filename.lower().endswith('.docx'):
        response_error("只支持 .docx 格式的 Word 文档")

    try:
        # 生成唯一文件名
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = f"{timestamp}_{unique_id}_{file.filename}"
        safe_filename = safe_filename.replace(" ", "_")

        # 保存文件
        upload_dir = ensure_upload_dir()
        file_path = os.path.join(upload_dir, safe_filename)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # 解析 docx
        try:
            parse_result = parse_docx_placeholders(file_path)
        except Exception as e:
            # 解析失败，删除已上传的文件
            if os.path.exists(file_path):
                os.remove(file_path)
            response_error(f"docx 解析失败: {str(e)}")

        return response_success(
            data=DocxUploadParseResult(
                html_content=parse_result["html_content"],
                placeholders=[
                    DocxPlaceholderInfo(**p) for p in parse_result["placeholders"]
                ],
                placeholder_count=parse_result["placeholder_count"],
            ),
            message="文件上传并解析成功",
        )

    except HTTPException:
        raise
    except Exception as e:
        response_error(f"文件上传失败: {str(e)}")
