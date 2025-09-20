import fitz
docs = fitz.open("C:\\uh\\surf\\resources\\ocy072.pdf")
for page_num, page in enumerate(docs):
    text = page.get_text()
    print(f"\n--- Page {page_num + 1} ---\n{text}\n")