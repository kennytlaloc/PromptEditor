export interface PromptVersion {
  title: string
  content: string
  savedAt: number
}

export interface Prompt {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  versions: PromptVersion[]  // oldest first; current state is NOT duplicated here
}
