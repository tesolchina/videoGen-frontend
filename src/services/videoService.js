// API service for communicating with backend
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://videogen-backend-production.up.railway.app'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const videoService = {
  // Generate audio from text
  async generateAudio(text, voice = 'en-US-JennyNeural') {
    try {
      const response = await apiClient.post('/api/tts', {
        text,
        voice,
        format: 'audio-24khz-48kbitrate-mono-mp3'
      })
      return response.data
    } catch (error) {
      throw new Error(`Audio generation failed: ${error.message}`)
    }
  },

  // Generate video with audio and visuals
  async generateVideo(audioFile, options = {}) {
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('options', JSON.stringify(options))

      const response = await apiClient.post('/api/video/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw new Error(`Video generation failed: ${error.message}`)
    }
  },

  // Get job status
  async getJobStatus(jobId) {
    try {
      const response = await apiClient.get(`/api/jobs/${jobId}/status`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get job status: ${error.message}`)
    }
  }
}

export default videoService
