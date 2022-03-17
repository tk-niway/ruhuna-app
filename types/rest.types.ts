import { Request } from "express";
import { Message, User, Village } from "@prisma/client";

export type CustomRequest = Request & {
  currentUser?: User & { 
    villages: Village[] 
    messages: Message[]
  };
  query:{
    [key:string]:string
  } | {}
};

export type ErrorObject = {
  code:number
  message:string
}

export type ResponseHeader = {
  "X-Total-Count"?:number
  "X-TotalPages-Count"?:number
}