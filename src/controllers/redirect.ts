import type { TuftContext } from 'tuft';
import type { DbClient } from '../db';

import { badRequestResponse, notFoundResponse, serverErrorResponse } from '../error-responses';

export async function redirect(db: DbClient, t: TuftContext) {
  const { hash } = t.request.params;

  if (hash.length !== 6) {
    // The provided path segment is not a valid hash.
    return badRequestResponse;
  }

  try {
    const result = await db.get(hash);

    if (!result) {
      // An item containing the provided hash does not exist.
      return notFoundResponse;
    }

    return { redirect: result.url };
  }

  catch (err) {
    console.error(err);
    return serverErrorResponse;
  }
}
