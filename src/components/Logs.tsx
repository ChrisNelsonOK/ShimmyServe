import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

export default function Logs() {
  return (
    <div className="p-6 h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Logs</h1>
          <p className="text-muted-foreground mt-1">
            Real-time logging interface with filtering and analytics
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 h-96 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Logging Interface</h3>
            <p className="text-muted-foreground">Coming in Phase 6 - Real-time logs, analytics, filtering</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
