from pydantic import BaseModel
from typing import List, Optional

class ContestTemplateTestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    is_sample: bool

class ContestTemplateCreate(BaseModel):
    title: str

    # question
    question_title: str
    description: str
    input_format: str
    output_format: str
    constraints: Optional[str] = None
    time_limit_ms: int
    memory_limit_kb: int

    test_cases: List[ContestTemplateTestCaseCreate]

class ContestTemplateSummary(BaseModel):
    id: int
    title: str

class ContestTemplateDetail(BaseModel):
    id: int
    title: str
    question_title: str
    description: str
    input_format: str
    output_format: str
    constraints: Optional[str]
    time_limit_ms: int
    memory_limit_kb: int
    test_cases: List[ContestTemplateTestCaseCreate]

from pydantic import BaseModel
from typing import List

class ContestTemplateTestCaseCreate(BaseModel):
    input_data: str
    expected_output: str
    is_sample: bool

class ContestTemplateCreate(BaseModel):
    title: str
    description: str
    input_format: str
    output_format: str
    constraints: str
    time_limit_ms: int
    memory_limit_kb: int
    test_cases: List[ContestTemplateTestCaseCreate]
