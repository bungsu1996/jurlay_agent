import fs from "fs";
import path from "path";

export interface WrittenFileResult {
  path: string;
  success: boolean;
  error?: string;
}

export class FileSystemService {
  /**
   * Safely read a file from disk
   */
  public static readFileContent(filePath: string, maxChars: number = 4000): string {
    try {
      if (!fs.existsSync(filePath)) {
        return `[ERROR: File ${filePath} tidak ditemukan di disk]`;
      }
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        return this.scanDirectory(filePath);
      }
      const content = fs.readFileSync(filePath, "utf-8");
      if (content.length > maxChars) {
        return content.substring(0, maxChars) + `\n\n[... Di-truncate ${content.length - maxChars} karakter sisanya ...]`;
      }
      return content;
    } catch (err: any) {
      return `[ERROR membaca file ${filePath}: ${err.message}]`;
    }
  }

  /**
   * Safely scan directory tree
   */
  public static scanDirectory(dirPath: string, maxFiles: number = 30): string {
    try {
      if (!fs.existsSync(dirPath)) {
        return `[ERROR: Direktori ${dirPath} tidak ditemukan di disk]`;
      }
      const items = fs.readdirSync(dirPath);
      const fileList = items.slice(0, maxFiles).map((item) => {
        const fullPath = path.join(dirPath, item);
        try {
          const isDir = fs.statSync(fullPath).isDirectory();
          return `${isDir ? "[DIR] " : "[FILE]"} ${item}`;
        } catch (e) {
          return `[UNK]  ${item}`;
        }
      });

      return `[STRUKTUR DIREKTORI ${dirPath} (${items.length} item)]:\n` + fileList.join("\n");
    } catch (err: any) {
      return `[ERROR membaca direktori ${dirPath}: ${err.message}]`;
    }
  }

  /**
   * Write file to disk recursively creating directories
   */
  public static writeFileToDisk(filePath: string, content: string): WrittenFileResult {
    try {
      const normalizedPath = path.normalize(filePath);
      const parentDir = path.dirname(normalizedPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(normalizedPath, content, "utf-8");
      return { path: normalizedPath, success: true };
    } catch (err: any) {
      return { path: filePath, success: false, error: err.message };
    }
  }

  /**
   * Automatically parse AI response text for code blocks with file path targets,
   * write them to disk, and return updated response text.
   */
  public static processAndWriteFilesFromAiResponse(
    text: string,
    defaultRootDir?: string
  ): { updatedText: string; writtenFiles: WrittenFileResult[] } {
    const writtenFiles: WrittenFileResult[] = [];
    const filesToCreate: { path: string; content: string }[] = [];

    // Pattern 1: Explicit target file line followed by code block
    // e.g. "Target lokasi file: C:\path\to\file.ts" or "File path: src/index.ts"
    const targetLineRegex = /(?:Target lokasi file|Target file|File path|FILE_PATH|Simpan di|Lokasi file|Path file|Path):\s*[\`"]?([a-zA-Z]:\\[^\n\`"]+|[a-zA-Z]:\/[^\n\`"]+|\/[^\n\`"]+|[a-zA-Z0-9_\-\.\:\/\\]+\.[a-zA-Z0-9]+)[\`"]?\s*\n+```[\w]*\n([\s\S]*?)```/gi;

    let match: RegExpExecArray | null;
    while ((match = targetLineRegex.exec(text)) !== null) {
      let rawPath = match[1].trim();
      const codeContent = match[2].trim();

      // Resolve relative path if root dir exists
      if (!path.isAbsolute(rawPath) && defaultRootDir) {
        rawPath = path.join(defaultRootDir, rawPath);
      }

      filesToCreate.push({ path: rawPath, content: codeContent });
    }

    // Pattern 2: // FILE_PATH: <path> comment inside code block
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    let cbMatch: RegExpExecArray | null;
    while ((cbMatch = codeBlockRegex.exec(text)) !== null) {
      const cbContent = cbMatch[1];
      const pathCommentMatch = cbContent.match(/(?:\/\/|#|<!--)\s*FILE_PATH:\s*([^\n\`"-->]+)/i);
      if (pathCommentMatch) {
        let filePath = pathCommentMatch[1].trim();
        if (!path.isAbsolute(filePath) && defaultRootDir) {
          filePath = path.join(defaultRootDir, filePath);
        }
        if (!filesToCreate.some((f) => f.path === filePath)) {
          filesToCreate.push({ path: filePath, content: cbContent.trim() });
        }
      }
    }

    // Perform actual write for each parsed file
    for (const f of filesToCreate) {
      console.log(`[FileSystemService] Auto-writing file to disk: "${f.path}"`);
      const result = this.writeFileToDisk(f.path, f.content);
      writtenFiles.push(result);
    }

    // Clean up full code blocks from display text if files were written, to keep chat clean
    let updatedText = text;
    if (writtenFiles.length > 0) {
      // Replace code blocks in display text with a clean background write badge
      updatedText = updatedText.replace(
        /```[\w]*\n([\s\S]*?)```/g,
        "\n*(⚡ Kode telah ditulis & diperbarui secara otomatis ke file fisik di background)*\n"
      );

      const successBadges = writtenFiles
        .filter((wf) => wf.success)
        .map((wf) => `📁 \`${wf.path}\``)
        .join("\n");

      const failBadges = writtenFiles
        .filter((wf) => !wf.success)
        .map((wf) => `❌ \`${wf.path}\`: ${wf.error}`)
        .join("\n");

      let systemNotice = "\n\n---\n✅ **[SYSTEM AUTO-FILE WRITER]**: File berikut telah OTOMATIS dibuat & ditulis secara fisik di PC Pak Nyons:\n" + successBadges;
      if (failBadges) {
        systemNotice += "\n" + failBadges;
      }
      updatedText += systemNotice;
    }

    return { updatedText, writtenFiles };
  }
}
