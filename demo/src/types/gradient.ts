// 渐变节点类型
export interface GradientNode {
  percentage: string; // 百分比位置，如 "0%", "50%", "100%"
  color: string; // 颜色值，如 "#ff0000"
}

// 渐变线定义
export interface GradientLine {
  length: number;
  center: Point;
  start: Point;
  end: Point;
}

// 点坐标
export interface Point {
  x: number;
  y: number;
}

// 元素边界
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 渐变类型
export type GradientType = 'linear' | 'radial';

// 渐变配置
export interface GradientConfig {
  type: GradientType;
  angle: number; // 角度（度数）
  nodes: Record<string, string>; // 百分比到颜色的映射
}

// 颜色选择器选项
export interface ColorPickerOptions {
  default: string;
  onchange?: (color: any, instance: any) => void;
  onsave?: (color: any, instance: any) => void;
  onshow?: (color: any, instance: any) => void;
}

// 渐变画廊项目
export interface GradientGalleryItem {
  id: string;
  css: string;
  name?: string;
}

// 渐变编辑器事件
export interface GradientEditorEvents {
  'change': (gradient: string) => void;
  'delete-node': (percentage: string) => void;
  'node-color-change': (percentage: string, color: string) => void;
}

// 临时节点状态
export interface TempNodeState {
  percentage: string;
  color: string;
  position: string;
  isEditing: boolean;
}

// 渐变编辑器状态
export interface GradientEditorState {
  gradientAngle: number;
  colorSequence: Record<string, string>;
  currentPercentage: number;
  showColorPanel: boolean;
  isMounted: boolean;
  changeNodePosition: boolean;
  tempNode: TempNodeState;
  isFocused: boolean;
  editAngle: boolean;
  currentMappingPoint: Point;
  isRadial: boolean;
  gradientValue: string;
  gradientLines: string;
}