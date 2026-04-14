"""初始化数据库和创建默认管理员账号"""
import sys
sys.path.insert(0, '.')

from server.core.database import engine, SessionLocal, Base
from server.core.security import get_password_hash
from server.models.user import User


def create_default_admin():
    """创建默认B端管理员账号"""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 检查是否已存在管理员
        existing_admin = db.query(User).filter(User.user_type == "B").first()
        if existing_admin:
            print(f"管理员已存在: {existing_admin.username}")
            return

        # 创建默认管理员
        admin = User(
            username="admin",
            password_hash=get_password_hash("Admin123"),
            user_type="B",
            is_active=True,
            first_login=True,  # 首次登录需要改密
        )
        db.add(admin)
        db.commit()
        print("默认管理员创建成功!")
        print("  用户名: admin")
        print("  密码: Admin123")
        print("  首次登录需要修改密码")
    finally:
        db.close()


if __name__ == "__main__":
    create_default_admin()
