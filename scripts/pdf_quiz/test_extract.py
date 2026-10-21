import base64
from io import BytesIO
from pathlib import Path
import unittest

from PIL import Image
from extract import extract


class LayoutTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = extract((Path(__file__).parent / 'fixtures/printed-quiz.pdf').read_bytes())
        cls.questions = {q['number']: q for q in cls.result['questions']}

    def test_green_key_and_answer_images_are_separate_from_question(self):
        q = self.questions[1]
        self.assertEqual(q['answers'], ['B'])
        self.assertEqual(q['stem'], 'Mô tả về tk quay là:')
        self.assertNotIn('Gợi ý', q['options']['D'])
        self.assertEqual(q['images'], [])
        self.assertEqual(len(q['explanationImages']), 1)
        raw = base64.b64decode(q['explanationImages'][0].split(',', 1)[1])
        with Image.open(BytesIO(raw)) as image:
            image.load()
            self.assertGreater(image.width, 50)

    def test_option_across_page_break_does_not_capture_print_footer(self):
        q = self.questions[71]
        self.assertEqual(q['answers'], ['B'])
        self.assertEqual(q['options']['B'], 'Luôn nhận máu đến từ TM giữa cẳng tay')
        self.assertEqual(q['options']['D'], 'Tách ra một nhánh lớn là TM đầu để đổ về TM giữa khuỷu')
        self.assertEqual(q['explanation'], 'Đáp án B')
        for question in self.questions.values():
            values = [question['stem'], question['explanation'], *question['options'].values()]
            self.assertFalse(any('chrome-extension://' in v or '10/22/26' in v or '54/113' in v for v in values))

    def test_truncated_question_is_preserved_with_a_review_note(self):
        self.assertTrue(self.questions[73]['reviewNote'])
        self.assertEqual(self.questions[73]['answers'], [])


if __name__ == '__main__':
    unittest.main()
