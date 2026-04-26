import { describe, it, expect } from "vitest";
import { classifyTask, selectModel, inferCapabilities } from "../src/services/routing/taskRouter";
import type { RoutingRule } from "../src/types/routing";

const MODELS = ["qwen35-397b", "qwen35-4b", "llava-7b"];
const MODELS_NO_AUTO = MODELS; // none is "auto"

// ---------------------------------------------------------------------------
// classifyTask
// ---------------------------------------------------------------------------
describe("classifyTask", () => {
  it("returns 'vision' when there is an attachment regardless of message", () => {
    expect(classifyTask("hello", true)).toBe("vision");
    expect(classifyTask("analyze this", true)).toBe("vision");
  });

  it("returns 'code' for code-related keywords", () => {
    expect(classifyTask("debug this function", false)).toBe("code");
    expect(classifyTask("there is a syntax error", false)).toBe("code");
    expect(classifyTask("write a class for me", false)).toBe("code");
    expect(classifyTask("undefined variable exception", false)).toBe("code");
  });

  it("returns 'reasoning' for analysis keywords", () => {
    expect(classifyTask("analyze the architecture", false)).toBe("reasoning");
    expect(classifyTask("compare the tradeoffs", false)).toBe("reasoning");
    expect(classifyTask("explain why this works", false)).toBe("reasoning");
  });

  it("returns 'general' for unclassified messages", () => {
    expect(classifyTask("what is the capital of australia?", false)).toBe("general");
    expect(classifyTask("simple_answer", false)).toBe("general");
    expect(classifyTask("hello there", false)).toBe("general");
  });
});

// ---------------------------------------------------------------------------
// inferCapabilities
// ---------------------------------------------------------------------------
describe("inferCapabilities", () => {
  it("detects vision models", () => {
    expect(inferCapabilities("llava-7b").supportsVision).toBe(true);
    expect(inferCapabilities("gpt-4o").supportsVision).toBe(true);
    expect(inferCapabilities("qwen35-397b").supportsVision).toBe(false);
  });

  it("detects code models", () => {
    expect(inferCapabilities("deepseek-coder-7b").supportsCode).toBe(true);
    expect(inferCapabilities("codellama-13b").supportsCode).toBe(true);
    expect(inferCapabilities("qwen35-4b").supportsCode).toBe(false);
  });

  it("detects reasoning models", () => {
    expect(inferCapabilities("mixtral-8x7b").supportsReasoning).toBe(true);
    expect(inferCapabilities("qwen35-397b").supportsReasoning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// selectModel — user routing rules
// ---------------------------------------------------------------------------
describe("selectModel — user routing rules", () => {
  it("matches a keyword and routes to the specified model", () => {
    const rules: RoutingRule[] = [{ keyword: "simple_answer", model: "qwen35-4b" }];
    expect(
      selectModel("general", MODELS, "what is the capital of australia? simple_answer", rules),
    ).toBe("qwen35-4b");
  });

  it("matching is case-insensitive", () => {
    const rules: RoutingRule[] = [{ keyword: "SIMPLE_ANSWER", model: "qwen35-4b" }];
    expect(
      selectModel("general", MODELS, "what is the capital of france? simple_answer", rules),
    ).toBe("qwen35-4b");
  });

  it("treats the keyword as a regex", () => {
    const rules: RoutingRule[] = [{ keyword: "translate|summarize", model: "qwen35-4b" }];
    expect(selectModel("general", MODELS, "please summarize this", rules)).toBe("qwen35-4b");
    expect(selectModel("general", MODELS, "please translate this", rules)).toBe("qwen35-4b");
  });

  it("skips a rule if the specified model is not in the available models list", () => {
    const rules: RoutingRule[] = [{ keyword: "simple_answer", model: "gpt-4o" }];
    // gpt-4o is not in MODELS — should fall back to default
    const result = selectModel("general", MODELS, "simple_answer", rules);
    expect(result).not.toBe("gpt-4o");
  });

  it("falls back to next rule if first rule's model is unavailable", () => {
    const rules: RoutingRule[] = [
      { keyword: "simple_answer", model: "gpt-4o" },   // unavailable
      { keyword: "simple_answer", model: "qwen35-4b" }, // available
    ];
    expect(selectModel("general", MODELS, "simple_answer", rules)).toBe("qwen35-4b");
  });

  it("falls back to capability routing when no keyword matches", () => {
    const rules: RoutingRule[] = [{ keyword: "translate", model: "qwen35-4b" }];
    // "simple_answer" doesn't match "translate"
    const result = selectModel("general", MODELS, "what is the capital? simple_answer", rules);
    // general task with no capability match → first model
    expect(result).toBe(MODELS[0]);
  });

  it("ignores rules with empty keyword or empty model", () => {
    const rules: RoutingRule[] = [
      { keyword: "", model: "qwen35-4b" },
      { keyword: "hello", model: "" },
    ];
    const result = selectModel("general", MODELS, "hello", rules);
    expect(result).toBe(MODELS[0]); // falls through to default
  });

  it("skips rules with invalid regex and continues to next rule", () => {
    const rules: RoutingRule[] = [
      { keyword: "[invalid", model: "qwen35-4b" }, // broken regex
      { keyword: "fallback", model: "qwen35-4b" },
    ];
    expect(selectModel("general", MODELS, "fallback", rules)).toBe("qwen35-4b");
  });

  it("user rules take priority over capability-based routing", () => {
    // "debug this function" → classifyTask returns "code"
    // capability routing would pick a code model, but user rules override
    const rules: RoutingRule[] = [{ keyword: "debug", model: "qwen35-4b" }];
    expect(selectModel("code", MODELS, "debug this function", rules)).toBe("qwen35-4b");
  });
});

// ---------------------------------------------------------------------------
// selectModel — default capability routing (no user rules)
// ---------------------------------------------------------------------------
describe("selectModel — default capability routing", () => {
  it("routes vision tasks to a vision-capable model", () => {
    // llava-7b is vision-capable
    expect(selectModel("vision", MODELS)).toBe("llava-7b");
  });

  it("falls back to first model when no capability match", () => {
    // general task, no vision/code/reasoning model matches qwen35-*
    expect(selectModel("general", MODELS)).toBe(MODELS[0]);
    expect(selectModel("code", MODELS)).toBe(MODELS[0]);
  });

  it("returns the first real model when list has only 'auto'", () => {
    expect(selectModel("general", ["auto"])).toBe("auto");
  });

  it("filters out 'auto' sentinel from candidate models", () => {
    const result = selectModel("general", ["auto", "qwen35-397b", "qwen35-4b"]);
    expect(result).not.toBe("auto");
    expect(result).toBe("qwen35-397b");
  });

  it("returns empty string when model list is empty", () => {
    expect(selectModel("general", [])).toBe("");
  });
});
