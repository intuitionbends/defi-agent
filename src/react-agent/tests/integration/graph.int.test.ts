import { describe, it } from "node:test";
import assert from "assert";
import { BaseMessage } from "@langchain/core/messages";
import { graph } from "../../graph.js";

describe("graph", () => {
  it("Simple runthrough", async () => {
    const res = await graph.invoke({
      messages: [
        {
          role: "user",
          content: "What is the current weather in SF?",
        },
      ],
    });

    assert(
      res.messages.find((message: BaseMessage) => message._getType() === "tool") !== undefined,
    );
  });
});
