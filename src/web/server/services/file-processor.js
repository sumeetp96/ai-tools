import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";
import uploadConfig from "../config/uploads.js";

class FileProcessor {
  /**
   * Process uploaded file and extract text
   */
  async processFile(file) {
    const category = uploadConfig.getCategory(file.originalname);

    if (!category) {
      throw new Error("Unsupported file type");
    }

    switch (category) {
      case "text":
      case "code":
        return this.processTextFile(file);

      case "document":
        return this.processPDF(file);

      case "image":
        return this.processImage(file);

      default:
        throw new Error("Unknown file category");
    }
  }

  /**
   * Process text/code files
   */
  async processTextFile(file) {
    try {
      const content = await fs.readFile(file.path, "utf-8");

      return {
        text: content,
        filename: file.originalname,
        size: file.size,
        type: "text",
      };
    } catch (error) {
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  /**
   * Process PDF files
   */
  async processPDF(file) {
    try {
      const dataBuffer = await fs.readFile(file.path);

      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      const details = await parser.getInfo({ parsePageInfo: true });
      await parser.destroy();

      // Extract text - handle both string and object returns
      const text = typeof result === 'string' ? result : (result.text || String(result));

      return {
        text,
        filename: file.originalname,
        size: file.size,
        type: "pdf",
        metadata: {
          pages: details.total,
          info: details.info,
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Process image files with OCR
   */
  async processImage(file) {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(file.path, "eng", {
        logger: () => {}, // Suppress logs
      });

      return {
        text: text.trim(),
        filename: file.originalname,
        size: file.size,
        type: "image",
      };
    } catch (error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Clean up temporary file
   */
  async cleanup(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to cleanup file: ${error.message}`);
    }
  }
}

export default new FileProcessor();
