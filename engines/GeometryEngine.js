/**
 * 几何引擎抽象接口
 * 所有引擎实现必须实现此接口
 */
class GeometryEngine {
  constructor() {
    if (new.target === GeometryEngine) {
      throw new Error("不能直接实例化抽象类");
    }
  }

  /**
   * 初始化引擎
   * @param {HTMLElement} container - 挂载容器
   * @param {Object} options - 配置选项
   * @returns {Promise<void>}
   */
  async init(container, options) {
    throw new Error("必须实现 init 方法");
  }

  /**
   * 执行几何命令
   * @param {string} command - 命令字符串
   * @returns {Promise<{success: boolean, label?: string, error?: string}>}
   */
  async executeCommand(command) {
    throw new Error("必须实现 executeCommand 方法");
  }

  /**
   * 获取画布上下文
   * @returns {Promise<{elements: Array, commands: Array, selectedObjects: Array}>}
   */
  async getCanvasContext() {
    throw new Error("必须实现 getCanvasContext 方法");
  }

  /**
   * 重置画板
   * @returns {Promise<{success: boolean}>}
   */
  async reset() {
    throw new Error("必须实现 reset 方法");
  }

  /**
   * 切换视图模式
   * @param {string} mode - 视图模式
   * @returns {Promise<{success: boolean}>}
   */
  async setPerspective(mode) {
    throw new Error("必须实现 setPerspective 方法");
  }

  /**
   * 获取选中对象
   * @returns {Promise<{selectedObjects: Array}>}
   */
  async getSelectedObjects() {
    throw new Error("必须实现 getSelectedObjects 方法");
  }

  /**
   * 计算表达式
   * @param {string} expr - 表达式
   * @returns {Promise<{success: boolean, result?: any}>}
   */
  async evalExpression(expr) {
    throw new Error("必须实现 evalExpression 方法");
  }

  /**
   * 导入文件
   * @param {File|Object} file - 文件对象
   * @returns {Promise<{success: boolean}>}
   */
  async importFile(file) {
    throw new Error("必须实现 importFile 方法");
  }

  /**
   * 导出文件
   * @returns {Promise<{success: boolean, data?: any, filename?: string}>}
   */
  async exportFile() {
    throw new Error("必须实现 exportFile 方法");
  }

  /**
   * 设置样式
   * @param {string} selector - 选择器
   * @param {Object} properties - 样式属性
   * @returns {Promise<{success: boolean}>}
   */
  async setStyle(selector, properties) {
    throw new Error("必须实现 setStyle 方法");
  }

  /**
   * 检查引擎是否就绪
   * @returns {boolean}
   */
  isReady() {
    throw new Error("必须实现 isReady 方法");
  }

  /**
   * 获取引擎名称
   * @returns {string}
   */
  getName() {
    throw new Error("必须实现 getName 方法");
  }
}

// 导出接口
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GeometryEngine };
} else if (typeof window !== 'undefined') {
  window.GeometryEngine = GeometryEngine;
}
