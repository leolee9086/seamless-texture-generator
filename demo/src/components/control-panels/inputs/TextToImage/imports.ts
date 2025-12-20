// Re-export from parent imports
import {
  fetchImageAsBase64,
  buildProxyUrl,
  computed,
  ref,
  watch,
  submitGenerationTask,
  pollTaskUntilComplete,
  type Ref,
  type ComputedRef,
  type TaskStatusResponse
} from '../imports'

import { fetchImageWithProxy } from '../../../../api/modelscope.api'

// Re-export SecureApiKeyInput components and utilities
import { secureKeyManager } from '../SecureApiKeyInput/SecureApiKeyInput.ctx'
import { API_KEY_PREFIX, EMPTY_API_KEY } from '../SecureApiKeyInput/SecureApiKeyInput.constants'
import { hasValidApiKey } from '../SecureApiKeyInput/SecureApiKeyInput.utils'

// Re-export components from parent directory
import { default as ApiKeyInput } from '../SecureApiKeyInput/SecureApiKeyInput.vue'
import { default as PromptInput } from '../PromptInput.vue'
import { default as ParameterGrid } from '../ParameterGrid.vue'
import { default as StatusDisplay } from '../StatusDisplay.vue'

export {
  fetchImageAsBase64,
  buildProxyUrl,
  computed,
  ref,
  watch,
  submitGenerationTask,
  pollTaskUntilComplete,
  Ref,
  ComputedRef,
  TaskStatusResponse,
  secureKeyManager,
  API_KEY_PREFIX,
  EMPTY_API_KEY,
  hasValidApiKey,
  ApiKeyInput,
  PromptInput,
  ParameterGrid,
  StatusDisplay,
  fetchImageWithProxy
}