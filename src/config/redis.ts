import { Redis } from "@upstash/redis";
import { env } from "./env.js";

const client = new Redis({
  url: env.REDIS_REST_URL,
  token: env.REDIS_REST_TOKEN,
});

export const redis = {
  setJson: (key: string, value: unknown, ttlSeconds: number) =>
    client.set(key, value, { ex: ttlSeconds }),
  getAndDeleteJson: <T>(key: string): Promise<T | null> =>
    client.getdel<T>(key),
};
