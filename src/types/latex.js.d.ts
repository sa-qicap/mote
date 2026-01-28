declare module "latex.js" {
  export function parse(input: string, options?: any): any;
  export class HtmlGenerator {
    constructor(options?: any);
  }
}

declare module "react-katex" {
  import { ComponentType } from "react";
  export const InlineMath: ComponentType<{ math: string }>;
  export const BlockMath: ComponentType<{ math: string }>;
}

declare module "pdf-parse" {
  function pdfParse(
    dataBuffer: Buffer,
    options?: any
  ): Promise<{ text: string; numpages: number; info: any }>;
  export = pdfParse;
}
