from pydantic import BaseModel
from typing import List, Optional

# ---------- REQUEST SCHEMAS ----------

class ContestTestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    is_sample: bool


class ContestCreate(BaseModel):
    title: str
    description: str
    input_format: str
    output_format: str
    constraints: Optional[str]
    time_limit_ms: int
    memory_limit_kb: int
    test_cases: List[ContestTestCaseCreate]


class ContestSubmissionCreate(BaseModel):
    source_code: str
    language_id: int


class ContestRunCreate(BaseModel):
    source_code: str
    language_id: int
    input_data: str
