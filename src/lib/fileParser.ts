import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';

// Set up the worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  try {
    if (fileExt === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      let hasTextContent = false;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        if (pageText.trim().length > 0) {
          hasTextContent = true;
        }
        fullText += pageText + '\n';
      }

      // scanned PDF সনাক্তকরণ (If scanned PDF, fallback to OCR using Tesseract.js)
      if (!hasTextContent || fullText.trim().length < 150) {
        console.log('⚠️ Scanned PDF detected or empty text. Initiating OCR via Tesseract.js...');
        let ocrText = '';
        
        // Create worker
        const worker = await createWorker('eng');

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const context = canvas.getContext('2d');
          
          if (context) {
            await (page.render as any)({ canvasContext: context, viewport, canvas }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            
            const ret = await worker.recognize(dataUrl);
            ocrText += ret.data.text + '\n';
          }
        }
        
        await worker.terminate();
        
        if (ocrText.trim().length > 0) {
          return ocrText;
        }
      }

      return fullText;
    } else if (fileExt === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else {
      // Fallback to basic text reading if unsupported (e.g. txt)
      return await file.text();
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error('Could not extract text from the file.');
  }
}
