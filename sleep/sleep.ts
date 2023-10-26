// Copyright (c) Fensak, LLC.
// SPDX-License-Identifier: MPL-2.0

/**
 * Sleep for the given number of milliseconds.
 */
export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
