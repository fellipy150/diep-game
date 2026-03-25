class AssetLoader {
  constructor() {
    this.cache = new Map()
    this.queue = []
    this.successCount = 0
    this.errorCount = 0
  }
  add(id, path) {
    this.queue.push({ id, path })
  }
  async loadAll() {
    const promises = this.queue.map(item => this.loadItem(item))
    await Promise.all(promises)
    console.log(
      `🎨 Assets carregados: ${this.successCount} sucesso, ${this.errorCount} erro.`
    )
    this.queue = []
  }
  loadItem(item) {
    return new Promise(resolve => {
      const img = new Image()
      img.src = item.path
      img.onload = () => {
        this.cache.set(item.id, img)
        this.successCount++
        resolve()
      }
      img.onerror = () => {
        console.error(`❌ Erro ao carregar: ${item.path}`)
        this.errorCount++
        resolve()
      }
    })
  }
  get(id) {
    return this.cache.get(id)
  }
}
export const assets = new AssetLoader()
