import { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    db: any;
    schema: any;
    activeDriver: "POSTGRES" | "MYSQL" | "SUPABASE";
    searchEngine: "OPENSEARCH" | "DATABASE";
  }
}
