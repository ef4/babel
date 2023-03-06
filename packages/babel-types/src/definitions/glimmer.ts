import { defineAliasedType, assertValueType } from "./utils";

const defineType = defineAliasedType("Glimmer");

defineType("GlimmerTemplate", {
  builder: ["content"],
  fields: {
    content: {
      validate: assertValueType("string"),
    },
  },
});
