import { Response } from "express";
import { PrismaClientValidationError } from "@prisma/client/runtime";
import { ErrorObject, ResponseHeader } from "./../types/rest.types";
import { params } from "../consts/params";

/**
 * for response error message to frontend
 * @param code
 * @param message
 * @returns
 */
export function genErrorObj(
  code: ErrorObject["code"],
  message: ErrorObject["message"]
): ErrorObject {
  return {
    code,
    message,
  };
}

export function sendError(res: Response, e: unknown): void {
  console.error(e);

  if (e instanceof PrismaClientValidationError) {
    console.error(e.message);
    res.status(400).json(genErrorObj(400, "Incorrect your request."));
    return;
  }

  res.status(500).json(genErrorObj(500, "Internal Server Error"));
}

/**
 * generate record information
 * @param count
 * @param par_page
 * @returns
 */
export function genResponseHeader(
  count: number,
  par_page: number | undefined
): ResponseHeader {
  let total_pages: number = 1;

  if (par_page && count > par_page) {
    total_pages = Math.ceil(count / par_page);
  }

  return {
    "x-total-count": count,
    "x-total-page-count": total_pages,
  };
}

/**
 * generate pagination as link
 * @param page
 * @param total_page
 * @param url
 * @returns
 */
export function genLinksHeader(
  page: number,
  total_page: number,
  url: string
): { next: string; prev: string } {
  const next: string =
    total_page > page
      ? url.replace(`${params.PAGE}=${page}`, `${params.PAGE}=${page + 1}`)
      : "";

  const prev: string =
    page > 1
      ? url.replace(`${params.PAGE}=${page}`, `${params.PAGE}=${page - 1}`)
      : "";

  return { next, prev };
}

/**
 * separate strings-field in a request params  with separator.
 * field = "field=id,name,createdAt"
 * @param field
 * @param separator
 * @returns
 */
export function parseFields(
  field: any,
  separator: string = ","
): { [key: string]: boolean } | undefined {
  if (!field || !field.length) return undefined;

  const fields: string[] = field.toString().split(separator);

  let fields_obj: { [key: string]: boolean } = {};

  fields.forEach((value) => {
    fields_obj[value] = true;
  });

  return fields_obj;
}

/**
 * optimize sort-string for prisma.js
 * sort = "sort=-createdAt,+updatedAt"
 * Prefix means "-" = desc, "+" = asc
 * @param sort
 * @param separator
 * @returns
 */
export function parseSort(
  sort: any,
  separator: string = ","
): { [key: string]: string }[] | undefined {
  if (!sort || !sort.length) return undefined;

  const sorts: string[] = sort.toString().split(separator);

  let sorts_obj: { [key: string]: string }[] = [];

  sorts.forEach((value) => {
    const key: string = value.slice(1);
    const val: string = value.charAt(0) === "-" ? "desc" : "asc";
    sorts_obj.push({
      [key]: val,
    });
  });

  return sorts_obj;
}

/**
 * optimize limit for prisma
 * @param limit
 * @param by_default
 * @returns
 */
export function parsePerPage(
  limit: any,
  by_default: number = 10
): number | undefined {
  if (isNaN(limit) || limit === null) return by_default;

  if (Number(limit) === 0) return undefined;

  return Number(limit);
}

/**
 *
 * @param offset : ;
 * @returns
 */
export function parseOffset(offset: any): number {
  if (isNaN(offset) || offset === null) return 0;

  return Number(offset);
}

/**
 * page =  total-record / limit
 * @param page
 * @returns
 */
export function parsePage(page: any): number {
  if (isNaN(page) || page === null) return 1;

  if (Number(page) < 1) return 1;

  return Number(page);
}

/**
 * calculate total skip records
 * @param par_page
 * @param page
 * @param offset
 * @returns
 */
export function calcSkipRecords(
  par_page: number | undefined,
  page: number,
  offset: number | undefined
): number | undefined {
  let skip: number | undefined = 0;

  if (par_page !== undefined) skip = par_page * (page - 1);

  if (offset !== undefined) skip += offset;

  return skip;
}
