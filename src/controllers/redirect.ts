import type { TuftContext } from 'tuft';
import type { DbClient } from '../db';

import { badRequestResponse, notFoundResponse, serverErrorResponse } from '../error-responses';

export async function redirect(db: DbClient, t: TuftContext) {
  const { urlId } = t.request.params;

  if (urlId.length !== 6) {
    // The provided path segment is not a valid url ID.
    return badRequestResponse;
  }

  try {
    const result = await db.get(urlId);

    if (!result) {
      // An item containing the provided url ID does not exist.
      return notFoundResponse;
    }

    return { redirect: result.url };
  }

  catch (err) {
    console.error(err);
    return serverErrorResponse;
  }
}
