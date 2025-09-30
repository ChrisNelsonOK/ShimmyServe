import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function Settings() {
  const { user, updatePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    theme: 'dark',
    autoStart: true,
    notifications: true,
    logLevel: 'info',
    maxLogSize: '100',
    autoBackup: false,
    backupInterval: '24',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'server', label: 'Server', icon: '🖥️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' },
  ]

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    try {
      const result = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword)
      if (result.success) {
        setMessage('Password updated successfully!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage(result.error || 'Failed to update password')
      }
    } catch (error) {
      setMessage('Failed to update password')
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Startup</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoStart}
              onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-300">Start server automatically on app launch</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-300">Enable desktop notifications</span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderServerSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Logging</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Log Level</label>
            <select
              value={settings.logLevel}
              onChange={(e) => handleSettingChange('logLevel', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Log File Size (MB)
            </label>
            <input
              type="number"
              value={settings.maxLogSize}
              onChange={(e) => handleSettingChange('maxLogSize', e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              min="1"
              max="1000"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Backup</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
              className="mr-3"
            />
            <span className="text-gray-300">Enable automatic backups</span>
          </label>
          {settings.autoBackup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Backup Interval (hours)
              </label>
              <input
                type="number"
                value={settings.backupInterval}
                onChange={(e) => handleSettingChange('backupInterval', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                min="1"
                max="168"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="bg-gray-700 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-300">Username:</span>
            <span className="text-white">{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Email:</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Role:</span>
            <span className="text-white capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Version:</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Platform:</span>
            <span className="text-white">{navigator.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">User Agent:</span>
            <span className="text-white text-xs truncate max-w-xs">
              {navigator.userAgent.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
        <div className="space-y-4">
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Export Data
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings()
      case 'server': return renderServerSettings()
      case 'security': return renderSecuritySettings()
      case 'advanced': return renderAdvancedSettings()
      default: return renderGeneralSettings()
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          {renderTabContent()}

          {/* Save Button */}
          {activeTab !== 'security' && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.includes('success') 
                ? 'bg-green-900 border border-green-700 text-green-300'
                : 'bg-red-900 border border-red-700 text-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
