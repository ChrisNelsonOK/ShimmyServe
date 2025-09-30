import { describe, it, expect } from 'vitest'
import { 
  cn, 
  formatBytes, 
  formatDuration, 
  formatTimestamp,
  debounce,
  throttle,
  generateId,
  sleep,
  validateUrl,
  validatePort,
  sanitizeFilename,
  parseLogLevel,
  getLogLevelColor,
  formatModelName,
  getModelSize,
  isValidModelFile
} from '../utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2')
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false
      
      expect(cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )).toBe('base-class active-class')
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1024 * 1024)).toBe('1 MB')
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    it('should handle negative values', () => {
      expect(formatBytes(-1024)).toBe('-1 KB')
    })

    it('should handle very large values', () => {
      expect(formatBytes(1024 ** 4)).toBe('1 TB')
      expect(formatBytes(1024 ** 5)).toBe('1 PB')
    })
  })

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(formatDuration(1000)).toBe('1s')
      expect(formatDuration(60000)).toBe('1m 0s')
      expect(formatDuration(3661000)).toBe('1h 1m 1s')
      expect(formatDuration(500)).toBe('500ms')
    })

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0ms')
    })

    it('should handle large durations', () => {
      expect(formatDuration(90061000)).toBe('1h 30m 1s') // 1.5 hours + 1 second
    })
  })

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const date = new Date('2023-12-01T10:30:45.123Z')
      const formatted = formatTimestamp(date)
      
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/)
    })

    it('should include milliseconds when specified', () => {
      const date = new Date('2023-12-01T10:30:45.123Z')
      const formatted = formatTimestamp(date, true)
      
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/)
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0
      const fn = () => callCount++
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(callCount).toBe(0)

      await sleep(150)
      expect(callCount).toBe(1)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0
      const fn = () => callCount++
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(callCount).toBe(1)

      await sleep(150)
      throttledFn()
      expect(callCount).toBe(2)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('sleep', () => {
    it('should wait for specified time', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(90) // Allow some tolerance
    })
  })

  describe('validateUrl', () => {
    it('should validate URLs correctly', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://localhost:8080')).toBe(true)
      expect(validateUrl('ftp://files.example.com')).toBe(true)
      
      expect(validateUrl('not-a-url')).toBe(false)
      expect(validateUrl('http://')).toBe(false)
      expect(validateUrl('')).toBe(false)
    })
  })

  describe('validatePort', () => {
    it('should validate ports correctly', () => {
      expect(validatePort(80)).toBe(true)
      expect(validatePort(8080)).toBe(true)
      expect(validatePort(65535)).toBe(true)
      
      expect(validatePort(0)).toBe(false)
      expect(validatePort(-1)).toBe(false)
      expect(validatePort(65536)).toBe(false)
      expect(validatePort(1.5)).toBe(false)
    })
  })

  describe('sanitizeFilename', () => {
    it('should sanitize filenames correctly', () => {
      expect(sanitizeFilename('normal-file.txt')).toBe('normal-file.txt')
      expect(sanitizeFilename('file with spaces.txt')).toBe('file with spaces.txt')
      expect(sanitizeFilename('file/with\\invalid:chars*.txt')).toBe('file_with_invalid_chars_.txt')
      expect(sanitizeFilename('file<with>more|invalid"chars?.txt')).toBe('file_with_more_invalid_chars_.txt')
    })

    it('should handle empty or invalid filenames', () => {
      expect(sanitizeFilename('')).toBe('untitled')
      expect(sanitizeFilename('   ')).toBe('untitled')
      expect(sanitizeFilename('...')).toBe('untitled')
    })
  })

  describe('parseLogLevel', () => {
    it('should parse log levels correctly', () => {
      expect(parseLogLevel('ERROR')).toBe('error')
      expect(parseLogLevel('warn')).toBe('warn')
      expect(parseLogLevel('Info')).toBe('info')
      expect(parseLogLevel('DEBUG')).toBe('debug')
      expect(parseLogLevel('unknown')).toBe('info')
    })
  })

  describe('getLogLevelColor', () => {
    it('should return correct colors for log levels', () => {
      expect(getLogLevelColor('error')).toBe('text-red-400')
      expect(getLogLevelColor('warn')).toBe('text-yellow-400')
      expect(getLogLevelColor('info')).toBe('text-blue-400')
      expect(getLogLevelColor('debug')).toBe('text-gray-400')
      expect(getLogLevelColor('unknown' as any)).toBe('text-gray-400')
    })
  })

  describe('formatModelName', () => {
    it('should format model names correctly', () => {
      expect(formatModelName('llama-2-7b-chat')).toBe('Llama 2 7B Chat')
      expect(formatModelName('mistral-7b-instruct')).toBe('Mistral 7B Instruct')
      expect(formatModelName('codellama-13b')).toBe('CodeLlama 13B')
      expect(formatModelName('simple-model')).toBe('Simple Model')
    })
  })

  describe('getModelSize', () => {
    it('should extract model size correctly', () => {
      expect(getModelSize('llama-2-7b-chat')).toBe('7B')
      expect(getModelSize('mistral-13b-instruct')).toBe('13B')
      expect(getModelSize('gpt-3.5-turbo')).toBe('Unknown')
      expect(getModelSize('model-without-size')).toBe('Unknown')
    })
  })

  describe('isValidModelFile', () => {
    it('should validate model files correctly', () => {
      expect(isValidModelFile('model.gguf')).toBe(true)
      expect(isValidModelFile('model.bin')).toBe(true)
      expect(isValidModelFile('model.safetensors')).toBe(true)
      expect(isValidModelFile('model.pt')).toBe(true)
      expect(isValidModelFile('model.pth')).toBe(true)
      
      expect(isValidModelFile('model.txt')).toBe(false)
      expect(isValidModelFile('model.json')).toBe(false)
      expect(isValidModelFile('model')).toBe(false)
      expect(isValidModelFile('')).toBe(false)
    })
  })
})
