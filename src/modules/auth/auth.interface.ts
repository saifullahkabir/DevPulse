import type { Role } from "../../enums/role.enum";

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
