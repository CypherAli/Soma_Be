"""Read printed quiz layouts from stdin; emit source text, keys and figures as JSON.

No filenames, catalogue lookup, AI requests or source files on disk. Keys come
from green option labels/circles or explicit answer text, never from medical hints.
"""
import base64
from io import BytesIO
import json
import re
import sys
import unicodedata

import pymupdf
from PIL import Image


def clean(lines):
    return re.sub(r"\s+", " ", " ".join(lines)).strip()


def green(color):
    r, g, b = color >> 16, (color >> 8) & 255, color & 255
    return g > 95 and g > r * 1.5 and b < g * 1.1


def context_heading(text, spans):
    return text.startswith("Về ") and all("Bold" in s["font"] for s in spans)


def image_url(doc, info, cache):
    xref = info.get("xref")
    if not xref:
        return None
    if xref not in cache:
        raw = doc.extract_image(xref)["image"]
        with Image.open(BytesIO(raw)) as original:
            picture = original.convert("RGB")
            picture.thumbnail((1600, 1600))
            out = BytesIO()
            picture.save(out, "WEBP", quality=90)
        cache[xref] = "data:image/webp;base64," + base64.b64encode(out.getvalue()).decode("ascii")
    return cache[xref]


def extract(data):
    with pymupdf.open(stream=data, filetype="pdf") as doc:
        if len(doc) > 600:
            raise ValueError("PDF vượt quá 600 trang; hãy tách nhỏ tài liệu.")
        questions, pages, cache = [], [], {}
        current, phase, option, pending = None, "stem", None, []
        context, question_x = None, 0
        labels = 0
        for page_number, page in enumerate(doc, 1):
            events, source_lines = [], []
            drawings = page.get_drawings()
            circles = [d["rect"] for d in drawings
                       if 10 < d["rect"].width < 32 and 0 < d["rect"].height < 32
                       and any(c and c[1] > .4 and c[0] < .2 and c[2] < c[1]
                               for c in (d.get("fill"), d.get("color")))]
            for block in page.get_text("dict", flags=pymupdf.TEXTFLAGS_TEXT)["blocks"]:
                for line in block.get("lines", []):
                    spans = line["spans"]
                    value = unicodedata.normalize("NFC", "".join(s["text"] for s in spans).strip())
                    box = pymupdf.Rect(line["bbox"])
                    if not value or box.y0 < 30 or box.y1 > page.rect.height - 30:
                        continue
                    # Browser print headers/footers are outside the content area.
                    if value.startswith("chrome-extension://"):
                        continue
                    label = bool(re.fullmatch(r"[A-F]", value) and box.x0 < page.rect.width * .22
                                 and any("Bold" in s["font"] for s in spans))
                    marked = any(green(s["color"]) for s in spans) or any(r.intersects(box) for r in circles)
                    events.append((box.y0, box.x0, "text", value, spans, marked, label))
                    source_lines.append((box, value, label))
            pages.append("\n".join(e[3] for e in events))
            deferred = set()
            for drawing in drawings:
                rect = drawing["rect"]
                if not (rect.width > page.rect.width * .35 and rect.height > 10
                        and 30 < rect.y0 < page.rect.height - 30
                        and rect.y1 >= page.rect.height - 35):
                    continue
                enclosed = [line for line in source_lines if rect.contains((line[0].tl + line[0].br) / 2)]
                if enclosed and not any(line[2] or line[0].x0 < rect.x0 + 30 for line in enclosed):
                    deferred.update((line[0].y0, line[0].x0) for line in enclosed)
            # Preserve PDF block order: vertically centred labels can follow or
            # precede multiline option text. Global y-sorting shifts option bodies.
            for info in page.get_image_info(xrefs=True):
                if not info.get("xref"):
                    continue
                box = info["bbox"]
                pos = next((i for i, e in enumerate(events) if e[0] > box[1]), len(events))
                events.insert(pos, (box[1], box[0], "image", info, None, False, False))
            for y, x, kind, value, spans, marked, label in events:
                if kind == "image":
                    if current:
                        url = image_url(doc, value, cache)
                        field = "explanationImages" if phase == "explanation" else "images"
                        if url and url not in current[field]:
                            current[field].append(url)
                    continue
                heading = re.fullmatch(r"Câu\s+hỏi\s+(\d+)\s*:", value, re.I)
                if heading:
                    if len(questions) >= 1000:
                        raise ValueError("Tài liệu vượt quá 1000 câu; hãy tách nhỏ tài liệu.")
                    current = dict(number=int(heading[1]), stem=[], options={}, answers=[],
                                   explanation=[], images=[], explanationImages=[], page=page_number,
                                   context=context, reviewNote=None)
                    questions.append(current)
                    question_x, phase, option, pending = x, "stem", None, []
                elif not current:
                    if context_heading(value, spans) and x < page.rect.width * .15:
                        context = value
                elif re.fullmatch(r"(?:Gợi ý|Giải thích)\s*:", value, re.I):
                    phase, option = "explanation", None
                elif phase in ("option", "explanation") and context_heading(value, spans) and x <= question_x + 4:
                    context = value
                elif phase != "explanation" and label:
                    labels += 1
                    option = value
                    current["options"][option] = pending
                    pending = []
                    phase = "option"
                    if marked:
                        current["answers"].append(option)
                elif phase != "explanation" and (y, x) in deferred:
                    pending.append(value)
                elif phase == "explanation":
                    current["explanation"].append(value)
                elif phase == "option" and option:
                    current["options"][option].append(value)
                elif x >= page.rect.width * .18 and phase == "stem":
                    pending.append(value)
                else:
                    current["stem"].append(value)
        for q in questions:
            q["stem"] = clean(q["stem"])
            q["options"] = {k: clean(v) for k, v in q["options"].items()}
            q["explanation"] = "\n".join(q["explanation"]).strip()
            explicit = re.search(r"(?:^|\n)\s*(?:Đáp\s*án|Answer|Key)\s*[:：-]?\s*([A-F](?:\s*[,;+&/]\s*[A-F])*)(?=[.：:\s]|$)",
                                 q["explanation"], re.I)
            written = re.findall(r"[A-F]", explicit[1].upper()) if explicit else []
            marked = sorted(set(q["answers"]))
            if marked and written and set(marked) != set(written):
                q["answers"] = []
                q["reviewNote"] = "Đáp án khoanh màu và đáp án viết trong lời giải khác nhau; cần đối chiếu."
            else:
                q["answers"] = marked or written
            if any(a not in q["options"] for a in q["answers"]):
                q["answers"] = []
                q["reviewNote"] = "Khóa đáp án trỏ vào phương án không có trong câu."
            q["answer"] = q["answers"][0] if q["answers"] else ""
            if len(q["options"]) < 2 or not q["stem"] or any(not v for v in q["options"].values()):
                q["reviewNote"] = "Câu bị thiếu phần dẫn hoặc nội dung phương án; cần xem lại nguồn."
            elif not q["answers"] and not q["reviewNote"]:
                q["reviewNote"] = "Chưa có khóa đáp án đọc được trong nguồn."
        return dict(recognized=bool(questions and labels), pages=pages, questions=questions)


if __name__ == "__main__":
    try:
        raw = sys.stdin.buffer.read(50 * 1024 * 1024 + 1)
        if len(raw) > 50 * 1024 * 1024:
            raise ValueError("Tệp lớn hơn 50 MB.")
        result = extract(raw)
        sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
