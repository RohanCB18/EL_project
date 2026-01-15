from pydantic import BaseModel
from typing import List, Optional


class ContestTestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    is_sample: bool


class ContestCreate(BaseModel):
    teacher_id: int
    title: str
    description: str
    input_format: str
    output_format: str
    constraints: Optional[str]
    time_limit_ms: int
    memory_limit_kb: int
    test_cases: List[ContestTestCaseCreate]


class ContestSubmissionCreate(BaseModel):
    student_id: int
    source_code: str
    language_id: int
