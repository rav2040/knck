import type { TuftContext } from 'tuft';
import type { Collection } from 'mongodb';

import { badRequestResponse, notFoundResponse, serverErrorResponse } from '../error-responses';

export async function redirect(db: Collection, t: TuftContext) {
  const { hash } = t.request.params;

  if (hash.length !== 6) {
    // The provided path segment is not a valid hash.
    return badRequestResponse;
  }

  try {
    const result = await db.findOne({ hash });

    if (!result) {
      // A document containing the provided hash does not exist.
      return notFoundResponse;
    }

    return { redirect: result.url };
  }

  catch (err) {
    console.error(err);
    return serverErrorResponse;
  }
}
