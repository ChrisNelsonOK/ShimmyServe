import { motion } from 'framer-motion'
import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  return (
    <div className="p-6 h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Application settings, user management, and configuration
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 h-96 flex items-center justify-center">
          <div className="text-center">
            <SettingsIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Settings Panel</h3>
            <p className="text-muted-foreground">Coming in Phase 5 - User management, configuration, preferences</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
