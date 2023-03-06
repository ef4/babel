import type Printer from "../printer";
import type * as t from "@babel/types";

export function GlimmerTemplate(this: Printer, node: t.GlimmerTemplate) {
  this.token("<template>");
  this.token(node.content);
  this.token("</template>");
}
