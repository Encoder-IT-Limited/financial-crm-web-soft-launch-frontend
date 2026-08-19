export type Realm = "admin" | "tenant";

export type Me = {
  id: string;
  name: string;
  email: string;
  realm: Realm;
  permissions: string[];
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    activeModules: string[];
  };
};
