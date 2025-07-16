from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard, resources, auth_router, users, admin

app = FastAPI(title="Wayne Secure System", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(resources.router)  # Removido prefix, pois o router já define as rotas
app.include_router(auth_router.router, prefix="/auth")
app.include_router(admin.router, prefix="/admin")

@app.get("/")
def root():
    return {
        "msg": "API Wayne Secure System v2.0",
        "features": [
            "Autenticação com JWT e sessões",
            "Sistema de backup e restore",
            "Relatórios de segurança avançados",
            "Rate limiting",
            "Auditoria completa",
            "Banco de dados persistente"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "timestamp": "2025-01-09T00:00:00Z",
        "version": "2.0.0"
    }

@app.get("/cors-test")
def cors_test():
    return {"msg": "CORS está funcionando!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)