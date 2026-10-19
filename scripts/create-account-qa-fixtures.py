from pathlib import Path
from reportlab.pdfgen import canvas
from docx import Document

root = Path(__file__).resolve().parents[1] / "docs" / "audits" / "fixtures"
root.mkdir(parents=True, exist_ok=True)
lines = [
    "SOMA_QA_20261014 - Disposable workflow fixture",
    "1. Which option is the test marker ONE?",
    "A. ONE", "B. TWO", "C. THREE", "D. FOUR", "Answer: A",
    "2. Which option is the test marker TWO?",
    "A. ONE", "B. TWO", "C. THREE", "D. FOUR", "Answer: B",
]
pdf = canvas.Canvas(str(root / "SOMA_QA_20261014.pdf"))
pdf.setFont("Helvetica", 12)
for i, line in enumerate(lines):
    pdf.drawString(48, 790 - i * 24, line)
pdf.save()
doc = Document()
for line in lines:
    doc.add_paragraph(line)
doc.save(root / "SOMA_QA_20261014.docx")
print("Created two disposable fixtures: 2 questions each, answers A and B")
