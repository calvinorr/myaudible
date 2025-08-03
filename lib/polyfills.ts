// Polyfills for Node.js compatibility

// Add File polyfill for Node.js < 20
if (typeof globalThis.File === 'undefined') {
  class File {
    public name: string
    public lastModified: number
    public size: number
    public type: string

    constructor(fileBits: any[], fileName: string, options?: { type?: string; lastModified?: number }) {
      this.name = fileName
      this.lastModified = options?.lastModified ?? Date.now()
      this.type = options?.type ?? ''
      this.size = 0 // Simplified implementation
    }

    async text(): Promise<string> {
      return ''
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0)
    }

    slice(): File {
      return new File([], this.name, { type: this.type, lastModified: this.lastModified })
    }

    stream(): ReadableStream {
      return new ReadableStream()
    }
  }

  globalThis.File = File as any
}

// Export for explicit imports if needed
export const FilePolyfill = globalThis.File