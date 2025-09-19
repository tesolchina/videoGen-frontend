<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          🎬 AI Video Generator
        </h1>
        <p class="text-gray-600">
          Create professional videos with AI-generated narration and animated bullet points
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Panel: Input -->
        <div class="space-y-6">
          <!-- Script Input -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">📝 Script</h2>
            <textarea
              v-model="videoStore.script"
              @input="debouncedExtractBullets"
              placeholder="Enter your script here..."
              class="w-full h-40 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          
            <div class="mt-4 space-y-2">
              <button
                @click="generateAudio"
                :disabled="!videoStore.script || videoStore.isGeneratingAudio"
                class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ videoStore.isGeneratingAudio ? 'Generating...' : '🎵 Generate Audio' }}
              </button>
            
              <button
                @click="generateVideo"
                :disabled="!videoStore.audioFile || videoStore.isGenerating"
                class="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ videoStore.isGenerating ? 'Processing...' : '🎬 Generate Video' }}
              </button>

              <button
                @click="generateQuickVideo"
                :disabled="videoStore.isGenerating"
                class="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ videoStore.isGenerating ? 'Processing...' : '⚡ Quick Video (No Audio)' }}
              </button>

              <button
                @click="resetAll"
                class="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔄 Reset
              </button>
            </div>

            <!-- Progress Bar -->
            <div v-if="videoStore.progress > 0" class="mt-4">
              <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>{{ progressLabel }}</span>
                <div class="flex items-center gap-2">
                  <span>{{ videoStore.progress }}%</span>
                  <span v-if="videoStore.isGenerating && videoStore.remainingTime > 0" 
                        class="text-blue-600 font-medium">
                    ⏱️ {{ videoStore.getTimeDisplay() }}
                  </span>
                </div>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  :style="`width: ${videoStore.progress}%`"
                />
              </div>
              
              <!-- Timeout warning -->
              <div v-if="videoStore.hasTimedOut" 
                   class="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-center gap-2 text-red-700">
                  <span>⏰</span>
                  <span class="font-medium">Generation timed out</span>
                </div>
                <p class="text-sm text-red-600 mt-1">
                  Video generation took longer than expected. Please try again.
                </p>
              </div>
              
              <!-- Estimated time info -->
              <div v-else-if="videoStore.isGenerating" 
                   class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-blue-700">
                    ℹ️ Estimated time: {{ Math.floor(videoStore.estimatedTime / 60) }}:{{ (videoStore.estimatedTime % 60).toString().padStart(2, '0') }}
                  </span>
                  <button 
                    @click="cancelGeneration"
                    class="text-red-600 hover:text-red-700 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bullet Points -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">📌 Bullet Points</h2>
            <div class="space-y-2">
              <div
                v-for="(bullet, index) in videoStore.bullets"
                :key="index"
                class="flex items-start gap-2"
              >
                <span class="text-purple-600 mt-1">•</span>
                <input
                  v-model="videoStore.bullets[index]"
                  class="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  @click="removeBullet(index)"
                  class="text-red-500 hover:text-red-700 px-2"
                >
                  ×
                </button>
              </div>
              <button
                @click="addBullet"
                class="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                + Add bullet point
              </button>
            </div>
          </div>

          <!-- Settings -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">⚙️ Settings</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Resolution
                </label>
                <select
                  v-model="resolution"
                  @change="updateResolution"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="720p">1280×720 (HD)</option>
                  <option value="1080p">1920×1080 (Full HD)</option>
                  <option value="480p">854×480 (SD)</option>
                </select>
              </div>
            
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  v-model="videoStore.settings.format"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  FPS
                </label>
                <input
                  v-model.number="videoStore.settings.fps"
                  type="number"
                  min="24"
                  max="60"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <input
                  v-model="videoStore.settings.backgroundColor"
                  type="color"
                  class="w-full h-10 border rounded-lg cursor-pointer"
                />
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Voice
                </label>
                <select
                  v-model="videoStore.settings.voice"
                  class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="en-US-JennyNeural">Jenny (Female)</option>
                  <option value="en-US-GuyNeural">Guy (Male)</option>
                  <option value="en-US-AriaNeural">Aria (Female)</option>
                  <option value="en-US-DavisNeural">Davis (Male)</option>
                  <option value="en-GB-SoniaNeural">Sonia (British Female)</option>
                  <option value="en-GB-RyanNeural">Ryan (British Male)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Preview -->
        <div class="space-y-6">
          <!-- Canvas Preview -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">�️ Preview</h2>
            <canvas
              ref="previewCanvas"
              :width="videoStore.settings.width"
              :height="videoStore.settings.height"
              class="w-full border rounded-lg bg-black"
            />
            <div class="mt-2 text-sm text-gray-600">
              {{ videoStore.settings.width }}×{{ videoStore.settings.height }} @ {{ videoStore.settings.fps }}fps
            </div>
          </div>

          <!-- Audio Player -->
          <div v-if="videoStore.audioUrl" class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">🎧 Audio Preview</h2>
            <audio
              :src="videoStore.audioUrl"
              controls
              class="w-full"
              @loadedmetadata="onAudioLoaded"
            />
            <div class="mt-2 text-sm text-gray-600">
              Duration: {{ audioDuration }}s | Size: {{ audioSize }}
            </div>
          </div>

          <!-- Video Player -->
          <div v-if="videoStore.videoUrl" class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">🎥 Generated Video</h2>
            <video
              :src="videoStore.videoUrl"
              controls
              class="w-full rounded-lg bg-black"
              @loadedmetadata="onVideoLoaded"
              preload="metadata"
            />
            <div class="mt-2 text-sm text-gray-600">
              Duration: {{ videoDuration }}s | Format: {{ videoStore.settings.format.toUpperCase() }}
            </div>
            <div class="mt-4 flex gap-2">
              <button
                @click="downloadVideo"
                class="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📥 Save Video
              </button>
              <button
                @click="previewFullscreen"
                class="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔍 Fullscreen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useVideoStore } from '@/stores/videoStore'

const videoStore = useVideoStore()
const previewCanvas = ref(null)
const audioDuration = ref(0)
const videoDuration = ref(0)
const audioSize = ref('')
const resolution = ref('720p')

const progressLabel = computed(() => {
  if (videoStore.progress <= 30) return 'Preparing...'
  if (videoStore.progress <= 60) return 'Processing frames...'
  if (videoStore.progress <= 90) return 'Encoding video...'
  return 'Finalizing...'
})

const resolutionMap = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 }
}

function updateResolution() {
  const res = resolutionMap[resolution.value]
  videoStore.settings.width = res.width
  videoStore.settings.height = res.height
  drawPreview()
}

// Debounced function for bullet extraction
let debounceTimer = null
function debouncedExtractBullets() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    videoStore.extractBullets()
    drawPreview()
  }, 500)
}

function addBullet() {
  videoStore.bullets.push('')
}

function removeBullet(index) {
  videoStore.bullets.splice(index, 1)
}

async function generateAudio() {
  try {
    await videoStore.generateAudio()
  } catch (error) {
    console.error('Failed to generate audio:', error)
    alert('Failed to generate audio. Please try again.')
  }
}

async function generateVideo() {
  try {
    await videoStore.generateVideo()
  } catch (error) {
    console.error('Failed to generate video:', error)
    alert('Failed to generate video. Please try again.')
  }
}

async function generateQuickVideo() {
  try {
    await videoStore.generateQuickVideo()
  } catch (error) {
    console.error('Failed to generate quick video:', error)
    alert('Failed to generate quick video. Please try again.')
  }
}

function cancelGeneration() {
  videoStore.clearTimers()
  videoStore.isGenerating = false
  videoStore.progress = 0
  console.log('Video generation cancelled by user')
}

function resetAll() {
  videoStore.reset()
  audioDuration.value = 0
  videoDuration.value = 0
  audioSize.value = ''
}

function onAudioLoaded(event) {
  audioDuration.value = Math.round(event.target.duration)
  if (videoStore.audioFile) {
    audioSize.value = formatBytes(videoStore.audioFile.size)
  }
}

function onVideoLoaded(event) {
  videoDuration.value = Math.round(event.target.duration)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

function downloadVideo() {
  // Use the File System Access API for modern browsers with Save As dialog
  if ('showSaveFilePicker' in window) {
    downloadVideoModern()
  } else {
    // Fallback for older browsers
    downloadVideoFallback()
  }
}

async function downloadVideoModern() {
  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `ai-video-${Date.now()}.${videoStore.settings.format}`,
      types: [
        {
          description: 'Video files',
          accept: {
            'video/mp4': ['.mp4'],
            'video/webm': ['.webm'],
          },
        },
      ],
    })
    
    // Fetch the video data
    const response = await fetch(videoStore.videoUrl)
    const videoBlob = await response.blob()
    
    // Write to the selected file
    const writable = await fileHandle.createWritable()
    await writable.write(videoBlob)
    await writable.close()
    
    console.log('Video saved successfully')
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Save failed:', error)
      // Fallback to traditional download
      downloadVideoFallback()
    }
  }
}

function downloadVideoFallback() {
  const a = document.createElement('a')
  a.href = videoStore.videoUrl
  a.download = `ai-video-${Date.now()}.${videoStore.settings.format}`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function previewFullscreen() {
  // Create a fullscreen modal for video preview
  const modal = document.createElement('div')
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `
  
  const video = document.createElement('video')
  video.src = videoStore.videoUrl
  video.controls = true
  video.autoplay = true
  video.style.cssText = `
    max-width: 90vw;
    max-height: 90vh;
    border-radius: 8px;
  `
  
  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = '✕'
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `
  
  closeBtn.onclick = () => document.body.removeChild(modal)
  modal.onclick = (e) => {
    if (e.target === modal) document.body.removeChild(modal)
  }
  
  modal.appendChild(video)
  modal.appendChild(closeBtn)
  document.body.appendChild(modal)
}

function drawPreview() {
  if (!previewCanvas.value) return
  
  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  const { width, height, backgroundColor } = videoStore.settings

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, backgroundColor)
  gradient.addColorStop(1, '#764ba2')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Title
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(height * 0.067)}px system-ui`
  ctx.textAlign = 'center'
  ctx.fillText('AI Video Generator', width / 2, height * 0.14)

  // Smaller avatar with animation preview (moved left)
  const avatarX = width * 0.2 // Moved from 0.25 to 0.2
  const avatarY = height * 0.5
  const avatarRadius = Math.min(width, height) * 0.055 // Reduced from 0.08 to 0.055
  
  ctx.beginPath()
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.fill()

  // Avatar emoji
  ctx.font = `${Math.round(avatarRadius * 1.5)}px Arial`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🤖', avatarX, avatarY)

  // Bullets preview (moved left with more space)
  const bulletX = width * 0.4 // Moved from 0.5 to 0.4
  const bulletY = height * 0.25 // Moved up from 0.3
  const lineHeight = height * 0.11
  const maxBulletWidth = width * 0.55

  ctx.fillStyle = '#ffffff'
  ctx.font = `${Math.round(height * 0.045)}px system-ui` // Slightly smaller
  ctx.textAlign = 'left'

  videoStore.bullets.slice(0, 4).forEach((bullet, index) => {
    if (bullet) {
      ctx.globalAlpha = 0.3 + (index * 0.2)
      // Handle text wrapping for preview
      let displayText = bullet.toString()
      const maxChars = 40 // Increased from 35
      if (displayText.length > maxChars) {
        displayText = displayText.substring(0, maxChars - 3) + '...'
      }
      ctx.fillText(`• ${displayText}`, bulletX, bulletY + index * lineHeight)
    }
  })
  ctx.globalAlpha = 1

  // Progress bar placeholder
  const barWidth = width * 0.8
  const barHeight = height * 0.014
  const barX = (width - barWidth) / 2
  const barY = height - height * 0.083

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.fillRect(barX, barY, barWidth, barHeight)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillRect(barX, barY, barWidth * 0.3, barHeight) // Preview 30% progress
}

// Watch for changes and update preview
watch(() => videoStore.settings, drawPreview, { deep: true })
watch(() => videoStore.bullets, drawPreview, { deep: true })

onMounted(() => {
  // Set default script
  videoStore.script = `AI transforms education. First, AI personalizes learning. Next, it improves engagement. Then, it provides real-time feedback. Finally, it scales educational content.`
  
  videoStore.extractBullets()
  drawPreview()
})
</script>
