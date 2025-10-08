import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'

@Injectable()
export class DomEnv implements OnModuleInit, OnModuleDestroy {
  private registered = false
  async onModuleInit() {
    if (this.registered) return
    const { GlobalRegistrator } = await import('@happy-dom/global-registrator')
    GlobalRegistrator.register({ url: 'https://localhost' })
    this.registered = true
  }
  onModuleDestroy() {
    // GlobalRegistrator.unregister()
    // this.registered = false
  }
}
