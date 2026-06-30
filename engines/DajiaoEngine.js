/**
 * 大角几何引擎适配器
 * 使用 @dajiaoai/algeo-sdk
 */
class DajiaoEngine extends GeometryEngine {
  constructor() {
    super();
    this.presentation = null;
    this.appId = null;
    this.ready = false;
  }

  getName() {
    return "大角几何";
  }

  isReady() {
    return this.ready && !!this.presentation;
  }

  async init(container, options) {
    this.appId = options.appId || 'YTVJDQZR'; // 默认测试ID

    // 动态加载SDK
    await this.loadSDK();

    // 创建演示模式实例
    const { createPresentation } = window.AlgeoSdk || await import('@dajiaoai/algeo-sdk');
    
    this.presentation = await createPresentation(container, {
      auth: { appId: this.appId },
      ui: { logo: options.showLogo !== false }
    });

    // 监听就绪事件
    return new Promise((resolve) => {
      this.presentation.on('ready', () => {
        this.ready = true;
        resolve();
      });
    });
  }

  async loadSDK() {
    return new Promise((resolve, reject) => {
      if (window.AlgeoSdk) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@dajiaoai/algeo-sdk@2/dist/algeo-sdk.umd.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error("大角几何SDK加载失败"));
      document.head.appendChild(script);
    });
  }

  async executeCommand(command) {
    if (!this.presentation) {
      return { success: false, error: "大角几何未就绪" };
    }

    try {
      // 将GeoGebra命令转换为REPL命令
      const replCmd = this.convertToRepl(command);
      const result = await this.presentation.repl(replCmd);
      
      // 解析输出，提取标签
      const label = this.extractLabel(result.output);
      
      return { 
        success: true, 
        label: label, 
        output: result.output 
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  convertToRepl(ggbCmd) {
    // GeoGebra命令 → 大角几何REPL命令转换
    // 示例：
    // Point(0,0) → def P1 := Point(0,0)
    // Line(A,B) → def l := Line(A,B)
    // Circle(A,2) → def c := Circle(A,2)
    // SetColor(A,255,0,0) → style #A { color:#FF0000; }
    
    // 简单的转换逻辑（需要根据实际情况完善）
    const cmd = ggbCmd.trim();
    
    // 定义类命令
    if (cmd.match(/^(Point|Line|Circle|Segment|Polygon|Midpoint|PerpLine|ParallelLine)\(/i)) {
      // 自动分配标签
      const label = this.generateLabel();
      return `def ${label} := ${cmd}`;
    }
    
    // 样式类命令
    if (cmd.match(/^SetColor\(/i)) {
      const match = cmd.match(/SetColor\(([^,]+),\s*(\d+),\s*(\d+),\s*(\d+)\)/i);
      if (match) {
        const [, obj, r, g, b] = match;
        const hex = `#${this.toHex(r)}${this.toHex(g)}${this.toHex(b)}`;
        return `style #${obj} { color:${hex}; }`;
      }
    }
    
    // 其他命令直接返回（可能需要更多转换规则）
    return cmd;
  }

  generateLabel() {
    // 简单的标签生成逻辑
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idx = Math.floor(Math.random() * labels.length);
    return labels[idx] + Date.now().toString(36).slice(-2);
  }

  toHex(num) {
    const hex = parseInt(num).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  extractLabel(output) {
    // 从REPL输出中提取标签
    // 示例输出："Defined: P1"
    const match = output.match(/Defined:\s+(\w+)/i);
    return match ? match[1] : '';
  }

  async getCanvasContext() {
    if (!this.presentation) {
      return { error: "大角几何未就绪" };
    }

    try {
      const result = await this.presentation.repl('list');
      const elements = this.parseListOutput(result.output);
      
      return { 
        elements: elements, 
        commands: [], // REPL不直接暴露命令历史
        selectedObjects: [] // 大角几何不支持选中事件
      };
    } catch (e) {
      return { error: "获取画布上下文失败: " + e.message };
    }
  }

  parseListOutput(output) {
    // 解析REPL list命令的输出（Markdown表格格式）
    const lines = output.split('\n');
    const elements = [];
    
    for (const line of lines) {
      if (line.startsWith('|') && !line.includes('---')) {
        const cols = line.split('|').map(s => s.trim());
        // 跳过表头
        if (cols[1] && cols[1] !== 'ID') {
          elements.push({
            label: cols[1],
            type: cols[2] || 'unknown',
            value: cols[3] || '',
            definition: cols[4] || '',
            visible: cols[6] === 'true'
          });
        }
      }
    }
    
    return elements;
  }

  async reset() {
    if (!this.presentation) {
      return { success: false, error: "大角几何未就绪" };
    }

    try {
      await this.presentation.repl('clear');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async setPerspective(mode) {
    // 大角几何演示模式不支持视图切换
    return { 
      success: false, 
      error: "大角几何演示模式不支持视图切换，请使用编辑模式" 
    };
  }

  async getSelectedObjects() {
    // 大角几何不支持选中事件
    return { selectedObjects: [] };
  }

  async evalExpression(expr) {
    if (!this.presentation) {
      return { success: false, error: "大角几何未就绪" };
    }

    try {
      const result = await this.presentation.repl(`eval ${expr}`);
      return { success: true, result: result.output };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async importFile(file) {
    // 大角几何支持DSL JSON格式
    if (file instanceof File) {
      const text = await file.text();
      try {
        const content = JSON.parse(text);
        await this.presentation.loadFile(content);
        return { success: true };
      } catch (e) {
        return { success: false, error: "文件格式错误: " + e.message };
      }
    }
    return { success: false, error: "不支持的文件类型" };
  }

  async exportFile() {
    // 大角几何不支持导出.ggb，改为导出DSL JSON
    // 或者使用编辑模式的exportImage
    return { 
      success: false, 
      error: "大角几何演示模式不支持文件导出，请使用编辑模式" 
    };
  }

  async setStyle(selector, properties) {
    if (!this.presentation) {
      return { success: false, error: "大角几何未就绪" };
    }

    try {
      const styleProps = [];
      if (properties.color) {
        styleProps.push(`color:${properties.color};`);
      }
      if (properties.pointSize) {
        styleProps.push(`pointSize:${properties.pointSize};`);
      }
      if (properties.lineThickness) {
        styleProps.push(`lineThickness:${properties.lineThickness};`);
      }

      const styleCmd = `style #${selector} { ${styleProps.join(' ')} }`;
      await this.presentation.repl(styleCmd);
      
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DajiaoEngine };
} else if (typeof window !== 'undefined') {
  window.DajiaoEngine = DajiaoEngine;
}
