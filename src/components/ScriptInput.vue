// Script input component
<template>
  <div class="script-input">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Enter your script:
    </label>
    <textarea
      v-model="scriptText"
      @input="$emit('update:modelValue', scriptText)"
      class="w-full border rounded p-3 h-40 text-gray-800 resize-none"
      placeholder="Enter your script here..."
      spellcheck="false"
    ></textarea>
    
    <div class="mt-3 flex justify-between items-center text-sm text-gray-600">
      <span>Words: {{ wordCount }}</span>
      <span>Est. Duration: ~{{ estimatedDuration }}s</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScriptInput',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      scriptText: this.modelValue
    }
  },
  computed: {
    wordCount() {
      return this.scriptText.trim().split(/\s+/).filter(Boolean).length
    },
    estimatedDuration() {
      // ~0.4 seconds per word
      return Math.max(6, Math.min(60, Math.round(this.wordCount * 0.4)))
    }
  },
  watch: {
    modelValue(newVal) {
      this.scriptText = newVal
    }
  }
}
</script>
