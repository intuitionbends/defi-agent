export interface Thread {
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  type: "human" | "ai";
  original_id: string;
  content: string;
}
