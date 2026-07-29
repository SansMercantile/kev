"""
KEV Mathematics Department
Complete mathematics tutoring system for all levels
SansMercantile™ AI Development Team
"""

from .elementary.tutors.arithmetic_tutor import ElementaryArithmeticTutor
from .elementary.experts.math_expert import ElementaryMathExpert
from .elementary.teachers.math_teacher import ElementaryMathTeacher
from .elementary.invigilators.math_invigilator import ElementaryMathInvigilator
from .elementary.mentors.math_mentor import ElementaryMathMentor

from .middle_school.tutors.algebra_tutor import MiddleSchoolAlgebraTutor
from .middle_school.tutors.geometry_tutor import MiddleSchoolGeometryTutor
from .middle_school.experts.math_expert import MiddleSchoolMathExpert
from .middle_school.teachers.math_teacher import MiddleSchoolMathTeacher

from .high_school.tutors.algebra2_tutor import HighSchoolAlgebra2Tutor
from .high_school.tutors.geometry_tutor import HighSchoolGeometryTutor
from .high_school.tutors.trigonometry_tutor import HighSchoolTrigonometryTutor
from .high_school.tutors.calculus_tutor import HighSchoolCalculusTutor

from .university.tutors.linear_algebra_tutor import UniversityLinearAlgebraTutor
from .university.tutors.calculus_tutor import UniversityCalculusTutor
from .university.tutors.statistics_tutor import UniversityStatisticsTutor
from .university.tutors.discrete_math_tutor import UniversityDiscreteMathTutor

from .graduate.tutors.advanced_calculus_tutor import GraduateAdvancedCalculusTutor
from .graduate.tutors.abstract_algebra_tutor import GraduateAbstractAlgebraTutor
from .graduate.tutors.real_analysis_tutor import GraduateRealAnalysisTutor

__all__ = [
    # Elementary
    'ElementaryArithmeticTutor',
    'ElementaryMathExpert',
    'ElementaryMathTeacher',
    'ElementaryMathInvigilator',
    'ElementaryMathMentor',
    
    # Middle School
    'MiddleSchoolAlgebraTutor',
    'MiddleSchoolGeometryTutor',
    'MiddleSchoolMathExpert',
    'MiddleSchoolMathTeacher',
    
    # High School
    'HighSchoolAlgebra2Tutor',
    'HighSchoolGeometryTutor',
    'HighSchoolTrigonometryTutor',
    'HighSchoolCalculusTutor',
    
    # University
    'UniversityLinearAlgebraTutor',
    'UniversityCalculusTutor',
    'UniversityStatisticsTutor',
    'UniversityDiscreteMathTutor',
    
    # Graduate
    'GraduateAdvancedCalculusTutor',
    'GraduateAbstractAlgebraTutor',
    'GraduateRealAnalysisTutor',
]