from fastapi.security import OAuth2PasswordBearer


class _NoopLimiter:
    def limit(self, _rate: str):
        def decorator(func):
            return func
        return decorator


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
limiter = _NoopLimiter()
