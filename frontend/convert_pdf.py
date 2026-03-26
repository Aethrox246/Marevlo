import os
import glob
from pdf2docx import Converter

source_dir = r"c:\Users\sudha\Desktop\Marevlo\Marevlo\frontend\public\docx\courses\Data_Science\pytorch"
target_dir = r"c:\Users\sudha\Desktop\Marevlo\Marevlo\frontend\public\cources\Data_Science\pytorch"

if not os.path.exists(target_dir):
    os.makedirs(target_dir, exist_ok=True)

pdf_files = glob.glob(os.path.join(source_dir, "*.pdf"))

for pdf_file in pdf_files:
    base_name = os.path.basename(pdf_file)
    docx_name = os.path.splitext(base_name)[0] + ".docx"
    docx_file = os.path.join(target_dir, docx_name)
    
    print(f"Converting {pdf_file} to {docx_file}")
    try:
        cv = Converter(pdf_file)
        cv.convert(docx_file, start=0, end=None)
        cv.close()
    except Exception as e:
        print(f"Failed to convert {pdf_file}: {e}")
