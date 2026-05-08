from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.conversion import router as conversion_router
from .api.v1.pdf_tools import router as pdf_tools_router

app = FastAPI(
    title="ConverterFiles API",
    description="Herramientas de conversión y manipulación de archivos",
    version="2.0.0"
)

# Configuración de CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, limitar a los orígenes necesarios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(conversion_router, prefix="/api/v1", tags=["Conversion"])
app.include_router(pdf_tools_router, prefix="/api/v1/tools", tags=["PDF Tools"])

@app.get("/")
async def root():
    return {"message": "DocuScientific-HTML API is running"}
