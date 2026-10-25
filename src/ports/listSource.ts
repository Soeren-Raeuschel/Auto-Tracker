/** Anything that can list items (cars, news, ...). Basis for generic decorators. */
export interface ListSource<T> {
  list(): Promise<T[]>;
}
