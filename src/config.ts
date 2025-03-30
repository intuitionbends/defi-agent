export type Env = "dev" | "production";

export interface Config {
  env: Env;
  port: number;
}
