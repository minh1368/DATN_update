from pydantic import BaseModel


class AiChatMessage(BaseModel):
    role: str
    content: str


class AiChatRequest(BaseModel):
    message: str
    messages: list[AiChatMessage] = []


class AiChatResponse(BaseModel):
    reply: str
    provider: str
