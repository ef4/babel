import { defineAliasedType, assertValueType } from "./utils";

const defineType = defineAliasedType();

defineType("GlimmerTemplate", {
  builder: ["content"],
  fields: {
    content: {
      validate: assertValueType("string"),
    },
  },
});
