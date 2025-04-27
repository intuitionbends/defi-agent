import { initChatModel } from "langchain/chat_models/universal";

/**
 * Load a chat model from a fully specified name.
 * @param fullySpecifiedName - String in the format 'provider/model' or 'provider/account/provider/model'.
 * @returns A Promise that resolves to a BaseChatModel instance.
 */
// export async function loadChatModel(
//   fullySpecifiedName: string,
// ): Promise<ReturnType<typeof initChatModel>> {
//   const index = fullySpecifiedName.indexOf("/");
//   if (index === -1) {
//     // If there's no "/", assume it's just the model
//     return await initChatModel(fullySpecifiedName);
//   } else { 
//     const provider = fullySpecifiedName.slice(0, index);
//     const model = fullySpecifiedName.slice(index + 1);
//     return await initChatModel(model, { modelProvider: provider });
//   }
// }

export async function loadChatModel(
  fullySpecifiedName: string,
): Promise<ReturnType<typeof initChatModel>> {
  const index = fullySpecifiedName.indexOf("/");
  if (index === -1) {
    return await initChatModel(fullySpecifiedName);
  } else {
    const provider = fullySpecifiedName.slice(0, index);
    const model = fullySpecifiedName.slice(index + 1);

    const initOptions: any = {
      modelProvider: provider === "openrouter" ? "openai" : provider,
    };

    if (provider === "openrouter") {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("OPENROUTER_API_KEY is not defined");
    
      initOptions.configuration = {
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      };
    
      initOptions.modelProvider = "openai"; 
    }

    // console.log("Loading model:", model);
    // console.log("Provider:", provider);
    // console.log("BaseURL:", initOptions.baseURL);
    // console.log("API Key (OpenRouter):", initOptions.apiKey?.slice(0, 10));

    return await initChatModel(model, initOptions);
  }
}