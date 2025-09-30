import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Upload, Search, FileText, Tag, Filter, Plus, X,
  Download, Trash2, Edit, Eye, BarChart3, Network,
  File, FileImage, FileCode, Database, Globe, BookOpen,
  Zap, Clock, User, Hash, ChevronDown, ChevronRight
} from 'lucide-react'
import { useKnowledgeStore, Document, DocumentType, SearchResult } from '../stores/knowledgeStore'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../lib/utils'

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<'documents' | 'search' | 'graph'>('documents')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    documents,
    filteredDocuments,
    searchResults,
    knowledgeGraph,
    isLoading,
    isUploading,
    isProcessing,
    uploadProgress,
    searchQuery,
    selectedTags,
    selectedTypes,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    updateDocument,
    searchDocuments,
    generateSummary,
    buildKnowledgeGraph,
    applyFilters,
    clearFilters,
    getAllTags,
    getDocumentStats
  } = useKnowledgeStore()

  const { canAccessFeature } = useAuthStore()

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const stats = getDocumentStats()
  const allTags = getAllTags()

  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      await uploadDocument(file, {
        uploadedBy: 'current-user'
      })
    }
    setShowUploadModal(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const getFileIcon = (type: DocumentType) => {
    switch (type) {
      case 'pdf': return File
      case 'md': return BookOpen
      case 'txt': return FileText
      case 'json': return FileCode
      case 'csv': return Database
      case 'html': return Globe
      default: return FileText
    }
  }

  const getFileColor = (type: DocumentType) => {
    switch (type) {
      case 'pdf': return 'text-red-400'
      case 'md': return 'text-blue-400'
      case 'txt': return 'text-green-400'
      case 'json': return 'text-yellow-400'
      case 'csv': return 'text-purple-400'
      case 'html': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!canAccessFeature('knowledge-base')) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access the knowledge base</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="p-6 h-full overflow-hidden flex flex-col"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
            <p className="text-gray-400 mt-1">
              Manage documents, search content, and build your knowledge graph
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalDocuments}</div>
                <div className="text-sm text-gray-400">Documents</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{formatFileSize(stats.totalSize)}</div>
                <div className="text-sm text-gray-400">Total Size</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.documentsByStatus.ready}</div>
                <div className="text-sm text-gray-400">Ready</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{allTags.length}</div>
                <div className="text-sm text-gray-400">Tags</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('documents')}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors",
              activeTab === 'documents'
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Documents ({filteredDocuments.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors",
              activeTab === 'search'
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search ({searchResults.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('graph')
              buildKnowledgeGraph()
            }}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors",
              activeTab === 'graph'
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <Network className="w-4 h-4 inline mr-2" />
            Knowledge Graph
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => applyFilters({ searchQuery: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Document Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Types</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(['pdf', 'txt', 'md', 'docx', 'html', 'json', 'csv'] as DocumentType[]).map(type => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...selectedTypes, type]
                              : selectedTypes.filter(t => t !== type)
                            applyFilters({ selectedTypes: newTypes })
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300 uppercase">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {allTags.map(tag => (
                      <label key={tag} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={(e) => {
                            const newTags = e.target.checked
                              ? [...selectedTags, tag]
                              : selectedTags.filter(t => t !== tag)
                            applyFilters({ selectedTags: newTags })
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'documents' && (
                <div className="h-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading documents...</p>
                      </div>
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No documents found</h3>
                        <p className="text-gray-500 mb-4">Upload your first document to get started</p>
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Upload className="w-4 h-4 inline mr-2" />
                          Upload Document
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto h-full p-2">
                      {filteredDocuments.map((document) => {
                        const FileIcon = getFileIcon(document.type)
                        return (
                          <motion.div
                            key={document.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                            onClick={() => setSelectedDocument(document)}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <FileIcon className={cn("w-8 h-8", getFileColor(document.type))} />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate">{document.title}</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatFileSize(document.size)} • {document.type.toUpperCase()}
                                </p>
                              </div>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                document.status === 'ready' ? 'bg-green-400' :
                                document.status === 'processing' ? 'bg-yellow-400' :
                                document.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                              )} />
                            </div>

                            {document.summary && (
                              <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                                {document.summary}
                              </p>
                            )}

                            {document.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {document.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded">
                                    {tag}
                                  </span>
                                ))}
                                {document.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                                    +{document.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{document.metadata.updatedAt.toLocaleDateString()}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // View document
                                  }}
                                  className="p-1 hover:bg-gray-700 rounded"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteDocument(document.id)
                                  }}
                                  className="p-1 hover:bg-gray-700 rounded text-red-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'search' && (
                <div className="h-full flex flex-col">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search across all documents..."
                        value={searchQuery}
                        onChange={(e) => searchDocuments(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto">
                    {searchResults.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            {searchQuery ? 'No results found' : 'Start searching'}
                          </h3>
                          <p className="text-gray-500">
                            {searchQuery ? 'Try different keywords or check your spelling' : 'Enter a search query to find relevant documents'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {searchResults.map((result, index) => {
                          const FileIcon = getFileIcon(result.document.type)
                          return (
                            <motion.div
                              key={result.document.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <FileIcon className={cn("w-6 h-6 mt-1", getFileColor(result.document.type))} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-white font-medium">{result.document.title}</h3>
                                    <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                                      {Math.round(result.score * 100)}% match
                                    </span>
                                  </div>

                                  {result.relevantChunks.map((chunk, chunkIndex) => (
                                    <div key={chunkIndex} className="mb-2">
                                      <p className="text-sm text-gray-300">{chunk.content}</p>
                                    </div>
                                  ))}

                                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                    <span>{result.document.type.toUpperCase()}</span>
                                    <span>{formatFileSize(result.document.size)}</span>
                                    <span>{result.document.metadata.updatedAt.toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'graph' && (
                <div className="h-full bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="text-center">
                    <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">Knowledge Graph</h3>
                    <p className="text-gray-500">Interactive knowledge graph visualization coming soon</p>
                    {knowledgeGraph && (
                      <div className="mt-4 text-sm text-gray-400">
                        <p>{knowledgeGraph.nodes.length} documents, {knowledgeGraph.edges.length} connections</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Drag and Drop Overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-600/20 border-4 border-dashed border-blue-400 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Drop files here</h3>
              <p className="text-blue-200">Release to upload documents</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Upload Documents</h2>

              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">Click to select files or drag and drop</p>
                  <p className="text-sm text-gray-500">Supports PDF, TXT, MD, JSON, CSV, HTML</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md,.json,.csv,.html,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Uploading...</span>
                      <span className="text-blue-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
