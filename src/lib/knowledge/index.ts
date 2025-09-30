import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { documents, embeddings, type Document, type NewDocument, type Embedding, type NewEmbedding } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { loggingService } from '../logging';

// Document processors
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as csv from 'csv-parser';
import * as XLSX from 'xlsx';

export interface DocumentUpload {
  userId: string;
  file: {
    originalName: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  };
  metadata?: Record<string, any>;
}

export interface ProcessedDocument {
  id: string;
  content: string;
  chunks: string[];
  metadata: Record<string, any>;
}

export interface SearchResult {
  document: Document;
  chunks: Array<{
    content: string;
    score: number;
    chunkIndex: number;
  }>;
  relevanceScore: number;
}

export interface SearchOptions {
  query: string;
  userId?: string;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

export class KnowledgeBaseService extends EventEmitter {
  private readonly CHUNK_SIZE = 1000;
  private readonly CHUNK_OVERLAP = 200;

  constructor() {
    super();
  }

  // Upload and process document
  async uploadDocument(upload: DocumentUpload): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      await loggingService.info('Starting document upload', { 
        filename: upload.file.originalName,
        userId: upload.userId 
      });

      // Process document content
      const content = await this.extractContent(upload.file);
      if (!content) {
        return { success: false, error: 'Failed to extract content from document' };
      }

      // Create document record
      const documentId = uuidv4();
      const newDocument: NewDocument = {
        id: documentId,
        userId: upload.userId,
        filename: upload.file.filename,
        originalName: upload.file.originalName,
        mimeType: upload.file.mimetype,
        size: upload.file.size,
        content,
        metadata: upload.metadata ? JSON.stringify(upload.metadata) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(documents).values(newDocument);

      // Process document for vector search
      await this.processDocumentForSearch(documentId, content);

      // Clean up uploaded file
      if (fs.existsSync(upload.file.path)) {
        fs.unlinkSync(upload.file.path);
      }

      await loggingService.info('Document uploaded successfully', { 
        documentId,
        filename: upload.file.originalName,
        userId: upload.userId 
      });

      this.emit('documentUploaded', { documentId, userId: upload.userId });

      return { success: true, documentId };
    } catch (error) {
      await loggingService.error('Document upload failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Extract content from various file types
  private async extractContent(file: { path: string; mimetype: string; originalName: string }): Promise<string | null> {
    try {
      const buffer = fs.readFileSync(file.path);

      switch (file.mimetype) {
        case 'application/pdf':
          const pdfData = await pdfParse(buffer);
          return pdfData.text;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          const docxResult = await mammoth.extractRawText({ buffer });
          return docxResult.value;

        case 'text/plain':
        case 'text/markdown':
          return buffer.toString('utf-8');

        case 'text/csv':
          return await this.processCsvFile(file.path);

        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          return this.processExcelFile(buffer);

        case 'application/json':
          const jsonData = JSON.parse(buffer.toString('utf-8'));
          return JSON.stringify(jsonData, null, 2);

        default:
          // Try to read as text
          const text = buffer.toString('utf-8');
          // Check if it's valid text (not binary)
          if (this.isValidText(text)) {
            return text;
          }
          return null;
      }
    } catch (error) {
      await loggingService.error('Content extraction failed', error);
      return null;
    }
  }

  private async processCsvFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => {
          const content = rows.map(row => Object.values(row).join(' ')).join('\n');
          resolve(content);
        })
        .on('error', reject);
    });
  }

  private processExcelFile(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let content = '';

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      content += `Sheet: ${sheetName}\n`;
      content += sheetData.map((row: any) => row.join(' ')).join('\n');
      content += '\n\n';
    });

    return content;
  }

  private isValidText(text: string): boolean {
    // Check if the text contains mostly printable characters
    const printableChars = text.replace(/[\r\n\t]/g, '').length;
    const totalChars = text.length;
    return printableChars / totalChars > 0.7;
  }

  // Process document for vector search
  private async processDocumentForSearch(documentId: string, content: string): Promise<void> {
    try {
      // Split content into chunks
      const chunks = this.splitIntoChunks(content);

      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);

        if (embedding) {
          const embeddingRecord: NewEmbedding = {
            id: uuidv4(),
            documentId,
            chunkIndex: i,
            content: chunk,
            embedding: Buffer.from(new Float32Array(embedding).buffer),
            createdAt: new Date(),
          };

          await db.insert(embeddings).values(embeddingRecord);
        }
      }

      await loggingService.info('Document processed for search', { 
        documentId, 
        chunkCount: chunks.length 
      });
    } catch (error) {
      await loggingService.error('Document processing for search failed', error);
      throw error;
    }
  }

  // Split content into chunks
  private splitIntoChunks(content: string): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      if (currentChunk.length + trimmedSentence.length + 1 <= this.CHUNK_SIZE) {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = trimmedSentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  // Generate embedding (simplified - in production, use actual embedding service)
  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      // This is a placeholder - in production, you would use:
      // - OpenAI embeddings API
      // - Sentence transformers
      // - Local embedding models
      // For now, return a simple hash-based vector
      return this.simpleTextEmbedding(text);
    } catch (error) {
      await loggingService.error('Embedding generation failed', error);
      return null;
    }
  }

  // Simple text embedding (placeholder)
  private simpleTextEmbedding(text: string): number[] {
    const vector = new Array(384).fill(0); // 384-dimensional vector
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const index = (charCode + i + j) % vector.length;
        vector[index] += 1;
      }
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  // Search documents
  async searchDocuments(options: SearchOptions): Promise<SearchResult[]> {
    try {
      await loggingService.info('Searching documents', { query: options.query, userId: options.userId });

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(options.query);
      if (!queryEmbedding) {
        return [];
      }

      // Get all embeddings (in production, use vector database)
      let embeddingsQuery = db
        .select({
          id: embeddings.id,
          documentId: embeddings.documentId,
          chunkIndex: embeddings.chunkIndex,
          content: embeddings.content,
          embedding: embeddings.embedding,
        })
        .from(embeddings)
        .innerJoin(documents, eq(embeddings.documentId, documents.id));

      if (options.userId) {
        embeddingsQuery = embeddingsQuery.where(eq(documents.userId, options.userId));
      }

      const allEmbeddings = await embeddingsQuery;

      // Calculate similarity scores
      const scoredResults = allEmbeddings.map(emb => {
        const embVector = Array.from(new Float32Array(emb.embedding.buffer));
        const similarity = this.cosineSimilarity(queryEmbedding, embVector);
        
        return {
          ...emb,
          similarity,
        };
      });

      // Filter by threshold and sort by similarity
      const threshold = options.threshold || 0.1;
      const filteredResults = scoredResults
        .filter(result => result.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, options.limit || 10);

      // Group by document and get document details
      const documentMap = new Map<string, SearchResult>();

      for (const result of filteredResults) {
        if (!documentMap.has(result.documentId)) {
          const doc = await db
            .select()
            .from(documents)
            .where(eq(documents.id, result.documentId))
            .limit(1);

          if (doc.length > 0) {
            documentMap.set(result.documentId, {
              document: doc[0],
              chunks: [],
              relevanceScore: 0,
            });
          }
        }

        const searchResult = documentMap.get(result.documentId);
        if (searchResult) {
          searchResult.chunks.push({
            content: result.content,
            score: result.similarity,
            chunkIndex: result.chunkIndex,
          });
          searchResult.relevanceScore = Math.max(searchResult.relevanceScore, result.similarity);
        }
      }

      const results = Array.from(documentMap.values())
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      await loggingService.info('Document search completed', { 
        query: options.query, 
        resultCount: results.length 
      });

      return results;
    } catch (error) {
      await loggingService.error('Document search failed', error);
      return [];
    }
  }

  // Calculate cosine similarity
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Get user documents
  async getUserDocuments(userId: string, limit = 50, offset = 0): Promise<Document[]> {
    try {
      const docs = await db
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset);

      return docs;
    } catch (error) {
      await loggingService.error('Failed to get user documents', error);
      return [];
    }
  }

  // Delete document
  async deleteDocument(documentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify ownership
      const doc = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
        .limit(1);

      if (doc.length === 0) {
        return { success: false, error: 'Document not found or access denied' };
      }

      // Delete embeddings first (foreign key constraint)
      await db.delete(embeddings).where(eq(embeddings.documentId, documentId));

      // Delete document
      await db.delete(documents).where(eq(documents.id, documentId));

      await loggingService.info('Document deleted', { documentId, userId });

      this.emit('documentDeleted', { documentId, userId });

      return { success: true };
    } catch (error) {
      await loggingService.error('Document deletion failed', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get document by ID
  async getDocument(documentId: string, userId?: string): Promise<Document | null> {
    try {
      let query = db.select().from(documents).where(eq(documents.id, documentId));

      if (userId) {
        query = query.where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
      }

      const docs = await query.limit(1);
      return docs.length > 0 ? docs[0] : null;
    } catch (error) {
      await loggingService.error('Failed to get document', error);
      return null;
    }
  }

  // Get knowledge base statistics
  async getKnowledgeBaseStats(userId?: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    documentTypes: Record<string, number>;
    recentUploads: number;
  }> {
    try {
      let query = db.select().from(documents);
      
      if (userId) {
        query = query.where(eq(documents.userId, userId));
      }

      const docs = await query;

      const stats = {
        totalDocuments: docs.length,
        totalSize: docs.reduce((sum, doc) => sum + doc.size, 0),
        documentTypes: {} as Record<string, number>,
        recentUploads: 0,
      };

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      docs.forEach(doc => {
        // Count by mime type
        stats.documentTypes[doc.mimeType] = (stats.documentTypes[doc.mimeType] || 0) + 1;

        // Count recent uploads
        if (doc.createdAt >= oneWeekAgo) {
          stats.recentUploads++;
        }
      });

      return stats;
    } catch (error) {
      await loggingService.error('Failed to get knowledge base stats', error);
      return {
        totalDocuments: 0,
        totalSize: 0,
        documentTypes: {},
        recentUploads: 0,
      };
    }
  }
}
