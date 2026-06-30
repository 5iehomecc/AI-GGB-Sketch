/**
 * GeoGebra 引擎适配器
 * 包装现有的 ggbApp 实现，不修改原有代码
 */
class GeoGebraEngine extends GeometryEngine {
  constructor() {
    super();
    this.app = null; // 指向现有的 ggbApp
    this.selection = [];
  }

  getName() {
    return "GeoGebra";
  }

  isReady() {
    return !!this.app;
  }

  async init(container, options) {
    // 不修改现有初始化逻辑
    // 等待现有的 initGeoGebra() 完成后，获取 ggbApp 引用
    return new Promise((resolve, reject) => {
      const checkReady = setInterval(() => {
        if (window.ggbApplet) {
          this.app = window.ggbApplet;
          clearInterval(checkReady);
          resolve();
        }
      }, 100);

      // 超时处理
      setTimeout(() => {
        clearInterval(checkReady);
        reject(new Error("GeoGebra 初始化超时"));
      }, 30000);
    });
  }

  async executeCommand(command) {
    if (!this.app) {
      return { success: false, error: "GeoGebra 未就绪" };
    }

    // 复用现有的 executeGGBCommand 逻辑
    if (typeof this.app.asyncEvalCommandGetLabels === "function") {
      try {
        const label = await this.app.asyncEvalCommandGetLabels(command);
        const lastError = window.ggbLastCommandError || "";
        window.ggbLastCommandError = "";
        return { success: lastError === "", label: label || "", error: lastError };
      } catch (e) {
        return { success: false, label: "", error: e.message };
      }
    }

    // 降级到同步执行
    try {
      const result = this.app.evalCommand(command);
      const label = "";
      const lastError = window.ggbLastCommandError || "";
      window.ggbLastCommandError = "";
      return { 
        success: !!result && lastError === "", 
        label: label, 
        error: lastError || (result ? "" : "命令执行失败") 
      };
    } catch (e) {
      return { success: false, label: "", error: e.message };
    }
  }

  async getCanvasContext() {
    if (!this.app) {
      return { error: "GeoGebra 未就绪" };
    }

    // 复用现有的 getCanvasContext 逻辑
    try {
      const xml = this.app.getXML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");
      const elements = [], cmds = [];
      
      const construction = doc.querySelector("construction");
      if (construction) {
        const elems = construction.querySelectorAll("element");
        for (let i = 0; i < elems.length; i++) {
          const el = elems[i];
          const obj = { 
            label: el.getAttribute("label"), 
            type: el.getAttribute("type") 
          };
          const coords = el.querySelector("coords");
          if (coords) {
            obj.coords = { 
              x: coords.getAttribute("x"), 
              y: coords.getAttribute("y"), 
              z: coords.getAttribute("z") 
            };
          }
          const expression = el.querySelector("expression");
          if (expression && expression.getAttribute("value")) {
            obj.expression = expression.getAttribute("value");
          }
          elements.push(obj);
        }

        const commandEls = construction.querySelectorAll("command");
        for (let j = 0; j < commandEls.length; j++) {
          const cmd = commandEls[j];
          const cmdObj = { name: cmd.getAttribute("name"), input: {}, output: {} };
          const inputs = cmd.querySelectorAll("input");
          for (let k = 0; k < inputs.length; k++) {
            cmdObj.input["a" + k] = inputs[k].getAttribute("a0") || inputs[k].textContent;
          }
          const outputs = cmd.querySelectorAll("output");
          for (let m = 0; m < outputs.length; m++) {
            cmdObj.output["a" + m] = outputs[m].getAttribute("a0") || outputs[m].textContent;
          }
          cmds.push(cmdObj);
        }
      }

      return { 
        elements: elements, 
        commands: cmds, 
        selectedObjects: this.selection.slice() 
      };
    } catch (e) {
      return { error: "获取画布上下文失败: " + e.message };
    }
  }

  async reset() {
    if (!this.app) {
      return { success: false, error: "GeoGebra 未就绪" };
    }
    try {
      this.app.reset();
      this.selection = [];
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async setPerspective(mode) {
    if (!this.app) {
      return { success: false, error: "GeoGebra 未就绪" };
    }
    try {
      this.app.setPerspective(mode);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getSelectedObjects() {
    return { selectedObjects: this.selection.slice() };
  }

  async evalExpression(expr) {
    if (!this.app) {
      return { success: false, error: "GeoGebra 未就绪" };
    }
    try {
      const result = this.app.evalLaTeX(expr);
      return { success: true, result: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async importFile(file) {
    if (!this.app) {
      return { success: false, error: "GeoGebra 未就绪" };
    }
    // 现有逻辑：通过 FileReader 读取 .ggb 文件
    // 这里需要复用现有的导入逻辑
    return { success: false, error: "GeoGebra 导入功能待实现" };
  }

  async exportFile() {
    if (!this.app) {
      return { success: false, error: "GeoGebra 未就绪" };
    }
    // 复用现有的 exportGGB 逻辑
    return new Promise((resolve) => {
      try {
        const allObj = this.app.getAllObjectNames ? this.app.getAllObjectNames() : [];
        if (!allObj || allObj.length === 0) {
          resolve({ success: false, error: "画板为空" });
          return;
        }
        this.app.getBase64((base64) => {
          if (!base64) {
            resolve({ success: false, error: "导出失败" });
            return;
          }
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          resolve({ 
            success: true, 
            data: new Blob([bytes], { type: "application/octet-stream" }),
            filename: "geometry.ggb"
          });
        });
      } catch (e) {
        resolve({ success: false, error: e.message });
      }
    });
  }

  async setStyle(selector, properties) {
    // GeoGebra 使用 SetColor, SetLineThickness 等命令
    const commands = [];
    if (properties.color) {
      const r = parseInt(properties.color.substring(1, 3), 16);
      const g = parseInt(properties.color.substring(3, 5), 16);
      const b = parseInt(properties.color.substring(5, 7), 16);
      commands.push(`SetColor(${selector}, ${r}, ${g}, ${b})`);
    }
    if (properties.pointSize) {
      commands.push(`SetPointSize(${selector}, ${properties.pointSize})`);
    }
    if (properties.lineThickness) {
      commands.push(`SetLineThickness(${selector}, ${properties.lineThickness})`);
    }

    // 依次执行命令
    for (const cmd of commands) {
      await this.executeCommand(cmd);
    }
    return { success: true };
  }

  // 更新选中对象（由外部调用）
  updateSelection(selected) {
    this.selection = selected.slice();
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GeoGebraEngine };
} else if (typeof window !== 'undefined') {
  window.GeoGebraEngine = GeoGebraEngine;
}
