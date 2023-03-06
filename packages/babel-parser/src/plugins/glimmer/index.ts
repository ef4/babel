import type Parser from "../../parser";
import { type TokenType, tt } from "../../tokenizer/types";
import type { ExpressionErrors } from "../../parser/util";
import type * as N from "../../types";
import * as charCodes from "charcodes";

export default (superClass: typeof Parser) =>
  class GlimmerParserMixin extends superClass implements Parser {
    #tokenizeTemplateStart(): boolean {
      const opening = "<template";

      if (!this.#matchesString(this.state.pos, opening)) {
        return false;
      }
      let pos = this.state.pos + opening.length;
      while (pos < this.length) {
        if (this.input.charCodeAt(pos) === charCodes.greaterThan) {
          this.state.pos = pos + 1;
          return true;
        }
        pos++;
      }
      throw new Error("unterminated <template> start tag");
    }

    #closing = "</template>";

    #matchesString(pos: number, s: string): boolean {
      return this.input.slice(pos, pos + s.length) === s;
    }

    #tokenizeTemplateContent(): string {
      let pos = this.state.pos;
      while (pos < this.length) {
        if (this.input.charCodeAt(pos) === charCodes.lessThan) {
          if (
            this.input.slice(pos, pos + this.#closing.length) === this.#closing
          ) {
            const content = this.input.slice(this.state.pos, pos);
            this.state.pos = pos;
            return content;
          }
        }
        pos++;
      }
      throw new Error("unterminated <template> tag");
    }

    #tokenizeTemplateEnd(): void {
      if (!this.#matchesString(this.state.pos, this.#closing)) {
        this.unexpected();
      }
      this.state.pos += this.#closing.length;
    }

    getTokenFromCode(code: number): void {
      switch (this.#state) {
        case "normal": {
          if (code === charCodes.lessThan) {
            if (this.#tokenizeTemplateStart()) {
              return this.finishToken(tt.glimmerTemplateStart);
            }
          }
          return super.getTokenFromCode(code);
        }
        case "template-content": {
          const content = this.#tokenizeTemplateContent();
          return this.finishToken(tt.glimmerTemplateContent, content);
        }
        case "template-end": {
          this.#tokenizeTemplateEnd();
          return this.finishToken(tt.glimmerTemplateEnd);
        }
      }
    }

    #parseGlimmerTemplate(): N.GlimmerTemplate {
      const node = this.startNodeAt(this.state.startLoc);
      this.next();
      if (!this.match(tt.glimmerTemplateContent)) {
        this.unexpected();
      }
      node.content = this.state.value;
      this.next();
      if (!this.match(tt.glimmerTemplateEnd)) {
        this.unexpected();
      }
      this.next();
      return this.finishNode(node, "GlimmerTemplate");
    }

    parseExprAtom(refExpressionErrors?: ExpressionErrors | null): N.Expression {
      if (this.match(tt.glimmerTemplateStart)) {
        return this.#parseGlimmerTemplate();
      }
      return super.parseExprAtom(refExpressionErrors);
    }

    #state: "normal" | "template-content" | "template-end" = "normal";

    updateContext(prevType: TokenType): void {
      const { type } = this.state;
      if (type === tt.glimmerTemplateStart) {
        this.#state = "template-content";
      }
      if (type === tt.glimmerTemplateContent) {
        this.#state = "template-end";
      }
      if (prevType === tt.glimmerTemplateEnd) {
        this.#state = "normal";
      }
    }
  };
