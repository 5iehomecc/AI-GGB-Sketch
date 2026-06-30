/**
 * 引擎配置管理器
 */
class EngineConfig {
  constructor() {
    this.currentEngine = null;
    this.engines = {
      'geogebra': null,
      'dajiao': null
    };
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem('ai-ggb-engine-config');
    return saved ? JSON.parse(saved) : {
      activeEngine: 'geogebra', // 默认使用GeoGebra
      dajiaoAppId: '',
      showLogo: false
    };
  }

  saveConfig() {
    localStorage.setItem('ai-ggb-engine-config', JSON.stringify(this.config));
  }

  async getEngine(name) {
    if (!name) name = this.config.activeEngine;

    if (this.engines[name]) {
      return this.engines[name];
    }

    // 按需创建引擎实例
    if (name === 'geogebra') {
      this.engines.geogebra = new window.GeoGebraEngine();
    } else if (name === 'dajiao') {
      this.engines.dajiao = new window.DajiaoEngine();
    }

    return this.engines[name];
  }

  async switchEngine(name) {
    const engine = await this.getEngine(name);
    if (!engine) {
      throw new Error(`引擎 ${name} 不存在`);
    }

    this.currentEngine = engine;
    this.config.activeEngine = name;
    this.saveConfig();

    return engine;
  }

  getCurrentEngine() {
    return this.currentEngine;
  }

  updateDajiaoAppId(appId) {
    this.config.dajiaoAppId = appId;
    this.saveConfig();
  }
}

// 全局实例
if (typeof window !== 'undefined') {
  window.engineConfig = new EngineConfig();
}
