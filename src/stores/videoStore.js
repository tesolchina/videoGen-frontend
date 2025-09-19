import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const useVideoStore = defineStore('video', {
  state: () => ({
    script: '',
    bullets: [],
    audioFile: null,
    audioUrl: null,
    videoUrl: null,
    isGenerating: false,
    isGeneratingAudio: false,
    progress: 0,
    currentJob: null,
    // Timer and timeout state
    estimatedTime: 0,
    remainingTime: 0,
    startTime: 0,
    timerInterval: null,
    timeoutId: null,
    hasTimedOut: false,
    settings: {
      width: 1280,
      height: 720,
      fps: 30,
      format: 'mp4',
      backgroundColor: '#667eea',
      voice: 'en-US-JennyNeural'
    }
  }),

  actions: {
    async generateAudio() {
      try {
        this.isGeneratingAudio = true
        const response = await axios.post(`${API_BASE}/api/tts`, {
          text: this.script,
          voice: this.settings.voice,
          format: 'audio-24khz-48kbitrate-mono-mp3'
        }, {
          responseType: 'arraybuffer'
        })

        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' })
        this.audioFile = new File([audioBlob], 'audio.mp3', { 
          type: 'audio/mpeg' 
        })
        
        if (this.audioUrl) {
          URL.revokeObjectURL(this.audioUrl)
        }
        this.audioUrl = URL.createObjectURL(this.audioFile)
      
        return this.audioUrl
      } catch (error) {
        console.error('Audio generation failed:', error)
        throw error
      } finally {
        this.isGeneratingAudio = false
      }
    },

    async generateVideo() {
      if (!this.audioFile) {
        throw new Error('Please generate audio first')
      }

      this.isGenerating = true
      this.progress = 0
      this.startTimer(30, 90) // 30s estimated, 90s timeout

      try {
        const formData = new FormData()
        formData.append('audio', this.audioFile)
        formData.append('script', this.script)
        formData.append('bullets', JSON.stringify(this.bullets))
        formData.append('settings', JSON.stringify(this.settings))

        const response = await axios.post(
          `${API_BASE}/api/video/generate`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        this.currentJob = response.data.jobId
      
        // Poll for job completion
        await this.pollJobStatus(this.currentJob)
      
      } catch (error) {
        console.error('Video generation failed:', error)
        throw error
      } finally {
        this.clearTimers()
        this.isGenerating = false
      }
    },

    async generateQuickVideo() {
      this.isGenerating = true
      this.progress = 0
      this.startTimer(15, 45) // 15s estimated, 45s timeout

      try {
        const response = await axios.post(`${API_BASE}/api/video/quick`, {
          script: this.script,
          bullets: this.bullets,
          settings: this.settings
        })

        this.currentJob = response.data.jobId
        await this.pollJobStatus(this.currentJob)

      } catch (error) {
        console.error('Quick video generation failed:', error)
        throw error
      } finally {
        this.clearTimers()
        this.isGenerating = false
      }
    },

    async pollJobStatus(jobId) {
      const checkStatus = async () => {
        // Check if we've timed out
        if (this.hasTimedOut) {
          throw new Error('Video generation timed out. Please try again.')
        }

        try {
          const response = await axios.get(`${API_BASE}/api/jobs/${jobId}/status`)
          
          if (response.data.status === 'completed') {
            if (this.videoUrl) {
              URL.revokeObjectURL(this.videoUrl)
            }
            this.videoUrl = `${API_BASE}${response.data.result.url}`
            this.progress = 100
            this.clearTimers()
            return true
          } else if (response.data.status === 'failed') {
            throw new Error(response.data.error || 'Video generation failed')
          } else {
            this.progress = response.data.progress || 50
            return false
          }
        } catch (error) {
          if (error.response?.status === 404) {
            throw new Error('Job not found')
          }
          throw error
        }
      }

      while (!(await checkStatus())) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    },

    extractBullets() {
      // Simple bullet extraction from script
      const sentences = this.script.split(/[.!?]/)
      const keywords = [
        'first', 'second', 'third', 'next', 'then', 
        'finally', 'additionally', 'moreover', 'furthermore'
      ]
    
      let bullets = sentences
        .filter(s => keywords.some(k => s.toLowerCase().includes(k)))
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 4)

      // If not enough bullets found, create from sentences
      if (bullets.length < 4) {
        bullets = sentences
          .filter(s => s.trim().length > 20)
          .slice(0, 4)
          .map(s => {
            const trimmed = s.trim()
            return trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed
          })
      }

      // Clean up bullets
      this.bullets = bullets.map(bullet => {
        // Remove leading keywords and clean up
        const cleaned = bullet
          .replace(/^(first|second|third|next|then|finally|additionally|moreover|furthermore)[,\s]*/i, '')
          .trim()
        
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      }).filter(Boolean)

      // Ensure we have at least some default bullets
      if (this.bullets.length === 0) {
        this.bullets = [
          'Personalized learning',
          'Improves engagement',
          'Real-time feedback',
          'Global content scaling'
        ]
      }
    },

    // Timer and timeout management
    startTimer(estimatedSeconds, timeoutSeconds = 60) {
      this.estimatedTime = estimatedSeconds
      this.remainingTime = estimatedSeconds
      this.startTime = Date.now()
      this.hasTimedOut = false
      
      // Clear any existing timers
      this.clearTimers()
      
      // Set up countdown timer (updates every second)
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
        this.remainingTime = Math.max(0, this.estimatedTime - elapsed)
      }, 1000)
      
      // Set up timeout
      this.timeoutId = setTimeout(() => {
        this.hasTimedOut = true
        this.clearTimers()
        console.error('Video generation timed out')
      }, timeoutSeconds * 1000)
    },

    clearTimers() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }
    },

    getTimeDisplay() {
      const minutes = Math.floor(this.remainingTime / 60)
      const seconds = this.remainingTime % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },

    reset() {
      if (this.audioUrl) URL.revokeObjectURL(this.audioUrl)
      if (this.videoUrl && this.videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.videoUrl)
      }
    
      this.audioFile = null
      this.audioUrl = null
      this.videoUrl = null
      this.progress = 0
      this.currentJob = null
      this.isGenerating = false
      this.isGeneratingAudio = false
      
      // Clear timers
      this.clearTimers()
      this.estimatedTime = 0
      this.remainingTime = 0
      this.startTime = 0
      this.hasTimedOut = false
    }
  }
})
