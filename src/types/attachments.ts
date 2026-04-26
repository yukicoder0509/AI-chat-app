export interface Attachment {
  id: string;
  messageId: string;
  type: "image";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileName: string;
  fileSizeBytes: number;
  previewObjectUrl?: string;
  base64DataUrl: string;
}
