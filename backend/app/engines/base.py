from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseConverter(ABC):
    """
    Clase base abstracta para los motores de conversión.
    Sigue el patrón Strategy.
    """
    
    @abstractmethod
    async def convert(self, file_content: bytes) -> Dict[str, Any]:
        """
        Método que debe ser implementado por cada estrategia de conversión.
        Retorna un diccionario con 'html' y 'metadata'.
        """
        pass

    @property
    @abstractmethod
    def supported_extension(self) -> str:
        """Retorna la extensión que soporta este motor."""
        pass
