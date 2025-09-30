import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DocumentType = 'pdf' | 'txt' | 'md' | 'docx' | 'html' | 'json' | 'csv'
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error'

export interface Document {
  id: string
  title: string
  content: string
  type: DocumentType
  size: number
  status: DocumentStatus
  tags: string[]
  summary?: string
  embeddings?: number[]
  metadata: {
    author?: string
    createdAt: Date
    updatedAt: Date
    uploadedBy: string
    originalName: string
    mimeType: string
    wordCount?: number
    language?: string
  }
}

export interface SearchResult {
  document: Document
  score: number
  relevantChunks: Array<{
    content: string
    score: number
    startIndex: number
    endIndex: number
  }>
}

export interface KnowledgeGraph {
  nodes: Array<{
    id: string
    label: string
    type: 'document' | 'concept' | 'entity'
    size: number
    color: string
  }>
  edges: Array<{
    source: string
    target: string
    weight: number
    type: 'reference' | 'similarity' | 'contains'
  }>
}

export interface KnowledgeState {
  // Document data
  documents: Document[]
  filteredDocuments: Document[]
  selectedDocument: Document | null
  
  // Search and analysis
  searchResults: SearchResult[]
  knowledgeGraph: KnowledgeGraph | null
  
  // UI state
  isLoading: boolean
  isUploading: boolean
  isProcessing: boolean
  uploadProgress: number
  
  // Filters and search
  searchQuery: string
  selectedTags: string[]
  selectedTypes: DocumentType[]
  sortBy: 'title' | 'date' | 'size' | 'relevance'
  sortOrder: 'asc' | 'desc'
  
  // Actions
  loadDocuments: () => Promise<void>
  uploadDocument: (file: File, metadata?: Partial<Document['metadata']>) => Promise<{ success: boolean; error?: string }>
  deleteDocument: (documentId: string) => Promise<{ success: boolean; error?: string }>
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<{ success: boolean; error?: string }>
  
  // Search and analysis
  searchDocuments: (query: string, useSemanticSearch?: boolean) => Promise<void>
  generateSummary: (documentId: string) => Promise<{ success: boolean; summary?: string; error?: string }>
  generateEmbeddings: (documentId: string) => Promise<{ success: boolean; error?: string }>
  
  // Knowledge graph
  buildKnowledgeGraph: () => Promise<void>
  
  // Filters
  applyFilters: (filters: {
    searchQuery?: string
    selectedTags?: string[]
    selectedTypes?: DocumentType[]
    sortBy?: 'title' | 'date' | 'size' | 'relevance'
    sortOrder?: 'asc' | 'desc'
  }) => void
  clearFilters: () => void
  
  // Utilities
  getAllTags: () => string[]
  getDocumentStats: () => {
    totalDocuments: number
    totalSize: number
    documentsByType: Record<DocumentType, number>
    documentsByStatus: Record<DocumentStatus, number>
  }
}

// Mock embedding function (in production, this would call an AI service)
const generateMockEmbeddings = (text: string): number[] => {
  // Simple hash-based mock embeddings for demonstration
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  return Array.from({ length: 384 }, (_, i) => 
    Math.sin(hash * (i + 1) * 0.01) * 0.5 + 0.5
  )
}

// Mock summarization function
const generateMockSummary = (content: string): string => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const summaryLength = Math.min(3, Math.max(1, Math.floor(sentences.length * 0.2)))
  return sentences.slice(0, summaryLength).join('. ') + '.'
}

// Calculate cosine similarity between two vectors
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0
  
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      // Initial state
      documents: [],
      filteredDocuments: [],
      selectedDocument: null,
      searchResults: [],
      knowledgeGraph: null,
      isLoading: false,
      isUploading: false,
      isProcessing: false,
      uploadProgress: 0,
      searchQuery: '',
      selectedTags: [],
      selectedTypes: [],
      sortBy: 'date',
      sortOrder: 'desc',

      // Load documents (mock implementation)
      loadDocuments: async () => {
        try {
          set({ isLoading: true })
          
          // Mock documents for demonstration
          const mockDocuments: Document[] = [
            {
              id: '1',
              title: 'Getting Started with Shimmy',
              content: 'Shimmy is a high-performance LLM inference server built in Rust. This guide covers installation, configuration, and basic usage patterns.',
              type: 'md',
              size: 2048,
              status: 'ready',
              tags: ['guide', 'setup', 'documentation'],
              summary: 'A comprehensive guide to getting started with Shimmy LLM inference server.',
              embeddings: generateMockEmbeddings('Shimmy is a high-performance LLM inference server built in Rust'),
              metadata: {
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15'),
                uploadedBy: 'admin',
                originalName: 'getting-started.md',
                mimeType: 'text/markdown',
                wordCount: 256,
                language: 'en'
              }
            },
            {
              id: '2',
              title: 'API Reference',
              content: 'Complete API reference for Shimmy server endpoints, including authentication, model management, and inference requests.',
              type: 'json',
              size: 4096,
              status: 'ready',
              tags: ['api', 'reference', 'documentation'],
              summary: 'Complete API documentation for all Shimmy server endpoints.',
              embeddings: generateMockEmbeddings('Complete API reference for Shimmy server endpoints'),
              metadata: {
                createdAt: new Date('2024-01-20'),
                updatedAt: new Date('2024-01-20'),
                uploadedBy: 'admin',
                originalName: 'api-reference.json',
                mimeType: 'application/json',
                wordCount: 512,
                language: 'en'
              }
            }
          ]

          set({ 
            documents: mockDocuments,
            filteredDocuments: mockDocuments,
            isLoading: false 
          })

          // Apply current filters
          get().applyFilters({})

        } catch (error) {
          set({ isLoading: false })
          console.error('Failed to load documents:', error)
        }
      },

      // Upload new document
      uploadDocument: async (file, metadata = {}) => {
        try {
          set({ isUploading: true, uploadProgress: 0 })
          
          // Read file content
          const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsText(file)
          })

          // Simulate upload progress
          for (let i = 0; i <= 100; i += 10) {
            set({ uploadProgress: i })
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          const documentId = crypto.randomUUID()
          const now = new Date()
          
          const newDocument: Document = {
            id: documentId,
            title: metadata.originalName || file.name.replace(/\.[^/.]+$/, ''),
            content,
            type: file.name.split('.').pop()?.toLowerCase() as DocumentType || 'txt',
            size: file.size,
            status: 'processing',
            tags: [],
            metadata: {
              ...metadata,
              createdAt: now,
              updatedAt: now,
              uploadedBy: metadata.uploadedBy || 'current-user',
              originalName: file.name,
              mimeType: file.type,
              wordCount: content.split(/\s+/).length,
              language: 'en'
            }
          }

          // Add to state
          const { documents } = get()
          const updatedDocuments = [newDocument, ...documents]
          set({ 
            documents: updatedDocuments,
            filteredDocuments: updatedDocuments,
            isUploading: false,
            uploadProgress: 0
          })

          // Generate embeddings and summary in background
          setTimeout(async () => {
            await get().generateEmbeddings(documentId)
            await get().generateSummary(documentId)
          }, 100)

          return { success: true }

        } catch (error) {
          set({ isUploading: false, uploadProgress: 0 })
          console.error('Failed to upload document:', error)
          return { success: false, error: 'Failed to upload document' }
        }
      },

      // Delete document
      deleteDocument: async (documentId) => {
        try {
          const { documents: currentDocs } = get()
          const updatedDocuments = currentDocs.filter(doc => doc.id !== documentId)
          
          set({ 
            documents: updatedDocuments,
            filteredDocuments: updatedDocuments,
            selectedDocument: get().selectedDocument?.id === documentId ? null : get().selectedDocument
          })

          return { success: true }

        } catch (error) {
          console.error('Failed to delete document:', error)
          return { success: false, error: 'Failed to delete document' }
        }
      },

      // Update document
      updateDocument: async (documentId, updates) => {
        try {
          const { documents: currentDocs } = get()
          const updatedDocuments = currentDocs.map(doc => 
            doc.id === documentId ? { ...doc, ...updates, metadata: { ...doc.metadata, ...updates.metadata } } : doc
          )

          set({ 
            documents: updatedDocuments,
            filteredDocuments: updatedDocuments
          })

          return { success: true }

        } catch (error) {
          console.error('Failed to update document:', error)
          return { success: false, error: 'Failed to update document' }
        }
      },

      // Search documents
      searchDocuments: async (query, useSemanticSearch = false) => {
        try {
          const { documents } = get()
          
          if (!query.trim()) {
            set({ searchResults: [], searchQuery: '' })
            return
          }

          set({ searchQuery: query, isLoading: true })

          let results: SearchResult[] = []

          if (useSemanticSearch) {
            // Semantic search using embeddings
            const queryEmbeddings = generateMockEmbeddings(query)
            
            results = documents
              .filter(doc => doc.embeddings && doc.status === 'ready')
              .map(doc => {
                const similarity = cosineSimilarity(queryEmbeddings, doc.embeddings!)
                return {
                  document: doc,
                  score: similarity,
                  relevantChunks: [{
                    content: doc.content.substring(0, 200) + '...',
                    score: similarity,
                    startIndex: 0,
                    endIndex: 200
                  }]
                }
              })
              .filter(result => result.score > 0.3)
              .sort((a, b) => b.score - a.score)
          } else {
            // Text-based search
            const queryLower = query.toLowerCase()
            
            results = documents
              .filter(doc => 
                doc.title.toLowerCase().includes(queryLower) ||
                doc.content.toLowerCase().includes(queryLower) ||
                doc.tags.some(tag => tag.toLowerCase().includes(queryLower))
              )
              .map(doc => {
                const titleMatch = doc.title.toLowerCase().includes(queryLower)
                const contentMatch = doc.content.toLowerCase().includes(queryLower)
                const tagMatch = doc.tags.some(tag => tag.toLowerCase().includes(queryLower))
                
                let score = 0
                if (titleMatch) score += 0.6
                if (contentMatch) score += 0.3
                if (tagMatch) score += 0.1
                
                return {
                  document: doc,
                  score,
                  relevantChunks: [{
                    content: doc.content.substring(0, 200) + '...',
                    score,
                    startIndex: 0,
                    endIndex: 200
                  }]
                }
              })
              .sort((a, b) => b.score - a.score)
          }

          set({ searchResults: results, isLoading: false })

        } catch (error) {
          set({ isLoading: false })
          console.error('Search failed:', error)
        }
      },

      // Generate summary
      generateSummary: async (documentId) => {
        try {
          const { documents } = get()
          const document = documents.find(doc => doc.id === documentId)
          
          if (!document) {
            return { success: false, error: 'Document not found' }
          }

          set({ isProcessing: true })
          
          // Simulate AI processing time
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const summary = generateMockSummary(document.content)
          
          await get().updateDocument(documentId, { 
            summary,
            status: 'ready' as DocumentStatus
          })

          set({ isProcessing: false })
          
          return { success: true, summary }

        } catch (error) {
          set({ isProcessing: false })
          console.error('Failed to generate summary:', error)
          return { success: false, error: 'Failed to generate summary' }
        }
      },

      // Generate embeddings
      generateEmbeddings: async (documentId) => {
        try {
          const { documents } = get()
          const document = documents.find(doc => doc.id === documentId)
          
          if (!document) {
            return { success: false, error: 'Document not found' }
          }

          const embeddings = generateMockEmbeddings(document.content)
          
          await get().updateDocument(documentId, { embeddings })
          
          return { success: true }

        } catch (error) {
          console.error('Failed to generate embeddings:', error)
          return { success: false, error: 'Failed to generate embeddings' }
        }
      },

      // Build knowledge graph
      buildKnowledgeGraph: async () => {
        try {
          const { documents } = get()
          
          // Create nodes for documents
          const nodes = documents.map(doc => ({
            id: doc.id,
            label: doc.title,
            type: 'document' as const,
            size: Math.log(doc.size) * 2,
            color: doc.type === 'pdf' ? '#ef4444' : 
                   doc.type === 'md' ? '#3b82f6' : 
                   doc.type === 'txt' ? '#10b981' : '#6b7280'
          }))

          // Create edges based on similarity (mock implementation)
          const edges: KnowledgeGraph['edges'] = []
          
          for (let i = 0; i < documents.length; i++) {
            for (let j = i + 1; j < documents.length; j++) {
              const doc1 = documents[i]
              const doc2 = documents[j]
              
              if (doc1.embeddings && doc2.embeddings) {
                const similarity = cosineSimilarity(doc1.embeddings, doc2.embeddings)
                
                if (similarity > 0.5) {
                  edges.push({
                    source: doc1.id,
                    target: doc2.id,
                    weight: similarity,
                    type: 'similarity'
                  })
                }
              }
            }
          }

          const knowledgeGraph: KnowledgeGraph = { nodes, edges }
          set({ knowledgeGraph })

        } catch (error) {
          console.error('Failed to build knowledge graph:', error)
        }
      },

      // Apply filters
      applyFilters: (filters) => {
        const { 
          documents, 
          searchQuery: currentQuery,
          selectedTags: currentTags,
          selectedTypes: currentTypes,
          sortBy: currentSortBy,
          sortOrder: currentSortOrder
        } = get()

        const {
          searchQuery = currentQuery,
          selectedTags = currentTags,
          selectedTypes = currentTypes,
          sortBy = currentSortBy,
          sortOrder = currentSortOrder
        } = filters

        let filtered = documents.filter(doc => {
          // Search query filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase()
            if (!doc.title.toLowerCase().includes(query) &&
                !doc.content.toLowerCase().includes(query) &&
                !doc.tags.some(tag => tag.toLowerCase().includes(query))) {
              return false
            }
          }

          // Tags filter
          if (selectedTags.length > 0) {
            if (!selectedTags.some(tag => doc.tags.includes(tag))) {
              return false
            }
          }

          // Type filter
          if (selectedTypes.length > 0) {
            if (!selectedTypes.includes(doc.type)) {
              return false
            }
          }

          return true
        })

        // Sort documents
        filtered.sort((a, b) => {
          let comparison = 0
          
          switch (sortBy) {
            case 'title':
              comparison = a.title.localeCompare(b.title)
              break
            case 'date':
              comparison = a.metadata.updatedAt.getTime() - b.metadata.updatedAt.getTime()
              break
            case 'size':
              comparison = a.size - b.size
              break
            case 'relevance':
              // This would be based on search relevance in a real implementation
              comparison = 0
              break
          }

          return sortOrder === 'desc' ? -comparison : comparison
        })

        set({
          filteredDocuments: filtered,
          searchQuery,
          selectedTags,
          selectedTypes,
          sortBy,
          sortOrder
        })
      },

      // Clear filters
      clearFilters: () => {
        set({
          searchQuery: '',
          selectedTags: [],
          selectedTypes: [],
          sortBy: 'date',
          sortOrder: 'desc'
        })
        get().applyFilters({})
      },

      // Get all tags
      getAllTags: () => {
        const { documents } = get()
        const allTags = new Set<string>()
        documents.forEach(doc => {
          doc.tags.forEach(tag => allTags.add(tag))
        })
        return Array.from(allTags).sort()
      },

      // Get document statistics
      getDocumentStats: () => {
        const { documents } = get()
        
        const documentsByType: Record<DocumentType, number> = {
          pdf: 0, txt: 0, md: 0, docx: 0, html: 0, json: 0, csv: 0
        }
        
        const documentsByStatus: Record<DocumentStatus, number> = {
          uploading: 0, processing: 0, ready: 0, error: 0
        }

        let totalSize = 0

        documents.forEach(doc => {
          documentsByType[doc.type]++
          documentsByStatus[doc.status]++
          totalSize += doc.size
        })

        return {
          totalDocuments: documents.length,
          totalSize,
          documentsByType,
          documentsByStatus
        }
      }
    }),
    {
      name: 'knowledge-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedTags: state.selectedTags,
        selectedTypes: state.selectedTypes,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)
