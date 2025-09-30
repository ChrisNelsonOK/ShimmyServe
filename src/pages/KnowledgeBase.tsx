import React, { useState } from 'react'

interface Document {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
}

export function KnowledgeBase() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Project Documentation.pdf',
      type: 'application/pdf',
      size: 2048576,
      uploadDate: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Meeting Notes.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 524288,
      uploadDate: new Date('2024-01-14'),
    },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newDocuments = Array.from(files).map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
      }))

      setDocuments(prev => [...prev, ...newDocuments])
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSearch = () => {
    // This would implement actual search functionality
    console.log('Searching for:', searchQuery)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('image')) return '🖼️'
    if (type.includes('text')) return '📃'
    return '📁'
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Knowledge Base</h2>
        <p className="text-gray-400">
          Upload and manage documents for AI-powered search and retrieval.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Documents</h3>
        
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="text-4xl mb-4">📁</div>
            <p className="text-white font-medium mb-2">
              {isUploading ? 'Uploading...' : 'Click to upload files'}
            </p>
            <p className="text-gray-400 text-sm">
              Supports PDF, Word, Text, Markdown, CSV, and JSON files
            </p>
          </label>
        </div>

        {isUploading && (
          <div className="mt-4 bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-white">Processing documents...</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Search Documents</h3>
        
        <div className="flex space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Documents</h3>
          <span className="text-gray-400 text-sm">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-400">
              {searchQuery ? 'No documents found matching your search.' : 'No documents uploaded yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getFileIcon(doc.type)}</div>
                  <div>
                    <h4 className="text-white font-medium">{doc.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {formatFileSize(doc.size)} • Uploaded {doc.uploadDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    View
                  </button>
                  <button className="text-red-400 hover:text-red-300 text-sm font-medium">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Total Documents</h4>
          <p className="text-2xl font-bold text-white">{documents.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Total Size</h4>
          <p className="text-2xl font-bold text-white">
            {formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Uploads</h4>
          <p className="text-2xl font-bold text-white">
            {documents.filter(doc => 
              Date.now() - doc.uploadDate.getTime() < 7 * 24 * 60 * 60 * 1000
            ).length}
          </p>
        </div>
      </div>
    </div>
  )
}
