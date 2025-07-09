
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Appeal
 * 
 */
export type Appeal = $Result.DefaultSelection<Prisma.$AppealPayload>
/**
 * Model Inspector
 * 
 */
export type Inspector = $Result.DefaultSelection<Prisma.$InspectorPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Appeals
 * const appeals = await prisma.appeal.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Appeals
   * const appeals = await prisma.appeal.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.appeal`: Exposes CRUD operations for the **Appeal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Appeals
    * const appeals = await prisma.appeal.findMany()
    * ```
    */
  get appeal(): Prisma.AppealDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.inspector`: Exposes CRUD operations for the **Inspector** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Inspectors
    * const inspectors = await prisma.inspector.findMany()
    * ```
    */
  get inspector(): Prisma.InspectorDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Appeal: 'Appeal',
    Inspector: 'Inspector'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "appeal" | "inspector"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Appeal: {
        payload: Prisma.$AppealPayload<ExtArgs>
        fields: Prisma.AppealFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AppealFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AppealFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          findFirst: {
            args: Prisma.AppealFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AppealFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          findMany: {
            args: Prisma.AppealFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>[]
          }
          create: {
            args: Prisma.AppealCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          createMany: {
            args: Prisma.AppealCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.AppealDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          update: {
            args: Prisma.AppealUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          deleteMany: {
            args: Prisma.AppealDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AppealUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.AppealUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AppealPayload>
          }
          aggregate: {
            args: Prisma.AppealAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAppeal>
          }
          groupBy: {
            args: Prisma.AppealGroupByArgs<ExtArgs>
            result: $Utils.Optional<AppealGroupByOutputType>[]
          }
          count: {
            args: Prisma.AppealCountArgs<ExtArgs>
            result: $Utils.Optional<AppealCountAggregateOutputType> | number
          }
        }
      }
      Inspector: {
        payload: Prisma.$InspectorPayload<ExtArgs>
        fields: Prisma.InspectorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InspectorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InspectorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload>
          }
          findFirst: {
            args: Prisma.InspectorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InspectorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload>
          }
          findMany: {
            args: Prisma.InspectorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload>[]
          }
          create: {
            args: Prisma.InspectorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload>
          }
          createMany: {
            args: Prisma.InspectorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.InspectorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload>
          }
          update: {
            args: Prisma.InspectorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload>
          }
          deleteMany: {
            args: Prisma.InspectorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InspectorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.InspectorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InspectorPayload>
          }
          aggregate: {
            args: Prisma.InspectorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInspector>
          }
          groupBy: {
            args: Prisma.InspectorGroupByArgs<ExtArgs>
            result: $Utils.Optional<InspectorGroupByOutputType>[]
          }
          count: {
            args: Prisma.InspectorCountArgs<ExtArgs>
            result: $Utils.Optional<InspectorCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    appeal?: AppealOmit
    inspector?: InspectorOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Appeal
   */

  export type AggregateAppeal = {
    _count: AppealCountAggregateOutputType | null
    _avg: AppealAvgAggregateOutputType | null
    _sum: AppealSumAggregateOutputType | null
    _min: AppealMinAggregateOutputType | null
    _max: AppealMaxAggregateOutputType | null
  }

  export type AppealAvgAggregateOutputType = {
    id: number | null
    band: number | null
    level: number | null
    caseAge: number | null
  }

  export type AppealSumAggregateOutputType = {
    id: number | null
    band: number | null
    level: number | null
    caseAge: number | null
  }

  export type AppealMinAggregateOutputType = {
    id: number | null
    caseReference: string | null
    caseType: string | null
    procedureType: string | null
    band: number | null
    level: number | null
    siteAddress: string | null
    location: string | null
    localPlanningAuthority: string | null
    region: string | null
    caseStatus: string | null
    caseAge: number | null
    linkedCases: string | null
    finalCommentsDate: Date | null
    programmingStatus: string | null
    programmingNotes: string | null
    jobDetails: string | null
    jurisdiction: string | null
    specialCircumstances: string | null
    costsAppliedFor: string | null
    agent: string | null
    appellant: string | null
    caseOfficer: string | null
    lpaPhone: string | null
    agentphone: string | null
    appellantPhone: string | null
    caseOfficerPhone: string | null
    appealStartDate: Date | null
    validDate: Date | null
    eventType: string | null
    eventDate: Date | null
    eventStatus: string | null
    duration: string | null
    venue: string | null
  }

  export type AppealMaxAggregateOutputType = {
    id: number | null
    caseReference: string | null
    caseType: string | null
    procedureType: string | null
    band: number | null
    level: number | null
    siteAddress: string | null
    location: string | null
    localPlanningAuthority: string | null
    region: string | null
    caseStatus: string | null
    caseAge: number | null
    linkedCases: string | null
    finalCommentsDate: Date | null
    programmingStatus: string | null
    programmingNotes: string | null
    jobDetails: string | null
    jurisdiction: string | null
    specialCircumstances: string | null
    costsAppliedFor: string | null
    agent: string | null
    appellant: string | null
    caseOfficer: string | null
    lpaPhone: string | null
    agentphone: string | null
    appellantPhone: string | null
    caseOfficerPhone: string | null
    appealStartDate: Date | null
    validDate: Date | null
    eventType: string | null
    eventDate: Date | null
    eventStatus: string | null
    duration: string | null
    venue: string | null
  }

  export type AppealCountAggregateOutputType = {
    id: number
    caseReference: number
    caseType: number
    procedureType: number
    band: number
    level: number
    siteAddress: number
    location: number
    localPlanningAuthority: number
    region: number
    caseStatus: number
    caseAge: number
    linkedCases: number
    finalCommentsDate: number
    programmingStatus: number
    programmingNotes: number
    jobDetails: number
    jurisdiction: number
    specialCircumstances: number
    costsAppliedFor: number
    agent: number
    appellant: number
    caseOfficer: number
    lpaPhone: number
    agentphone: number
    appellantPhone: number
    caseOfficerPhone: number
    appealStartDate: number
    validDate: number
    eventType: number
    eventDate: number
    eventStatus: number
    duration: number
    venue: number
    _all: number
  }


  export type AppealAvgAggregateInputType = {
    id?: true
    band?: true
    level?: true
    caseAge?: true
  }

  export type AppealSumAggregateInputType = {
    id?: true
    band?: true
    level?: true
    caseAge?: true
  }

  export type AppealMinAggregateInputType = {
    id?: true
    caseReference?: true
    caseType?: true
    procedureType?: true
    band?: true
    level?: true
    siteAddress?: true
    location?: true
    localPlanningAuthority?: true
    region?: true
    caseStatus?: true
    caseAge?: true
    linkedCases?: true
    finalCommentsDate?: true
    programmingStatus?: true
    programmingNotes?: true
    jobDetails?: true
    jurisdiction?: true
    specialCircumstances?: true
    costsAppliedFor?: true
    agent?: true
    appellant?: true
    caseOfficer?: true
    lpaPhone?: true
    agentphone?: true
    appellantPhone?: true
    caseOfficerPhone?: true
    appealStartDate?: true
    validDate?: true
    eventType?: true
    eventDate?: true
    eventStatus?: true
    duration?: true
    venue?: true
  }

  export type AppealMaxAggregateInputType = {
    id?: true
    caseReference?: true
    caseType?: true
    procedureType?: true
    band?: true
    level?: true
    siteAddress?: true
    location?: true
    localPlanningAuthority?: true
    region?: true
    caseStatus?: true
    caseAge?: true
    linkedCases?: true
    finalCommentsDate?: true
    programmingStatus?: true
    programmingNotes?: true
    jobDetails?: true
    jurisdiction?: true
    specialCircumstances?: true
    costsAppliedFor?: true
    agent?: true
    appellant?: true
    caseOfficer?: true
    lpaPhone?: true
    agentphone?: true
    appellantPhone?: true
    caseOfficerPhone?: true
    appealStartDate?: true
    validDate?: true
    eventType?: true
    eventDate?: true
    eventStatus?: true
    duration?: true
    venue?: true
  }

  export type AppealCountAggregateInputType = {
    id?: true
    caseReference?: true
    caseType?: true
    procedureType?: true
    band?: true
    level?: true
    siteAddress?: true
    location?: true
    localPlanningAuthority?: true
    region?: true
    caseStatus?: true
    caseAge?: true
    linkedCases?: true
    finalCommentsDate?: true
    programmingStatus?: true
    programmingNotes?: true
    jobDetails?: true
    jurisdiction?: true
    specialCircumstances?: true
    costsAppliedFor?: true
    agent?: true
    appellant?: true
    caseOfficer?: true
    lpaPhone?: true
    agentphone?: true
    appellantPhone?: true
    caseOfficerPhone?: true
    appealStartDate?: true
    validDate?: true
    eventType?: true
    eventDate?: true
    eventStatus?: true
    duration?: true
    venue?: true
    _all?: true
  }

  export type AppealAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Appeal to aggregate.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Appeals
    **/
    _count?: true | AppealCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AppealAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AppealSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AppealMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AppealMaxAggregateInputType
  }

  export type GetAppealAggregateType<T extends AppealAggregateArgs> = {
        [P in keyof T & keyof AggregateAppeal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAppeal[P]>
      : GetScalarType<T[P], AggregateAppeal[P]>
  }




  export type AppealGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AppealWhereInput
    orderBy?: AppealOrderByWithAggregationInput | AppealOrderByWithAggregationInput[]
    by: AppealScalarFieldEnum[] | AppealScalarFieldEnum
    having?: AppealScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AppealCountAggregateInputType | true
    _avg?: AppealAvgAggregateInputType
    _sum?: AppealSumAggregateInputType
    _min?: AppealMinAggregateInputType
    _max?: AppealMaxAggregateInputType
  }

  export type AppealGroupByOutputType = {
    id: number
    caseReference: string
    caseType: string
    procedureType: string
    band: number
    level: number
    siteAddress: string
    location: string
    localPlanningAuthority: string
    region: string
    caseStatus: string
    caseAge: number
    linkedCases: string
    finalCommentsDate: Date
    programmingStatus: string
    programmingNotes: string
    jobDetails: string
    jurisdiction: string
    specialCircumstances: string
    costsAppliedFor: string
    agent: string
    appellant: string
    caseOfficer: string
    lpaPhone: string
    agentphone: string
    appellantPhone: string
    caseOfficerPhone: string
    appealStartDate: Date
    validDate: Date
    eventType: string
    eventDate: Date
    eventStatus: string
    duration: string
    venue: string
    _count: AppealCountAggregateOutputType | null
    _avg: AppealAvgAggregateOutputType | null
    _sum: AppealSumAggregateOutputType | null
    _min: AppealMinAggregateOutputType | null
    _max: AppealMaxAggregateOutputType | null
  }

  type GetAppealGroupByPayload<T extends AppealGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AppealGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AppealGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AppealGroupByOutputType[P]>
            : GetScalarType<T[P], AppealGroupByOutputType[P]>
        }
      >
    >


  export type AppealSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    caseReference?: boolean
    caseType?: boolean
    procedureType?: boolean
    band?: boolean
    level?: boolean
    siteAddress?: boolean
    location?: boolean
    localPlanningAuthority?: boolean
    region?: boolean
    caseStatus?: boolean
    caseAge?: boolean
    linkedCases?: boolean
    finalCommentsDate?: boolean
    programmingStatus?: boolean
    programmingNotes?: boolean
    jobDetails?: boolean
    jurisdiction?: boolean
    specialCircumstances?: boolean
    costsAppliedFor?: boolean
    agent?: boolean
    appellant?: boolean
    caseOfficer?: boolean
    lpaPhone?: boolean
    agentphone?: boolean
    appellantPhone?: boolean
    caseOfficerPhone?: boolean
    appealStartDate?: boolean
    validDate?: boolean
    eventType?: boolean
    eventDate?: boolean
    eventStatus?: boolean
    duration?: boolean
    venue?: boolean
  }, ExtArgs["result"]["appeal"]>



  export type AppealSelectScalar = {
    id?: boolean
    caseReference?: boolean
    caseType?: boolean
    procedureType?: boolean
    band?: boolean
    level?: boolean
    siteAddress?: boolean
    location?: boolean
    localPlanningAuthority?: boolean
    region?: boolean
    caseStatus?: boolean
    caseAge?: boolean
    linkedCases?: boolean
    finalCommentsDate?: boolean
    programmingStatus?: boolean
    programmingNotes?: boolean
    jobDetails?: boolean
    jurisdiction?: boolean
    specialCircumstances?: boolean
    costsAppliedFor?: boolean
    agent?: boolean
    appellant?: boolean
    caseOfficer?: boolean
    lpaPhone?: boolean
    agentphone?: boolean
    appellantPhone?: boolean
    caseOfficerPhone?: boolean
    appealStartDate?: boolean
    validDate?: boolean
    eventType?: boolean
    eventDate?: boolean
    eventStatus?: boolean
    duration?: boolean
    venue?: boolean
  }

  export type AppealOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "caseReference" | "caseType" | "procedureType" | "band" | "level" | "siteAddress" | "location" | "localPlanningAuthority" | "region" | "caseStatus" | "caseAge" | "linkedCases" | "finalCommentsDate" | "programmingStatus" | "programmingNotes" | "jobDetails" | "jurisdiction" | "specialCircumstances" | "costsAppliedFor" | "agent" | "appellant" | "caseOfficer" | "lpaPhone" | "agentphone" | "appellantPhone" | "caseOfficerPhone" | "appealStartDate" | "validDate" | "eventType" | "eventDate" | "eventStatus" | "duration" | "venue", ExtArgs["result"]["appeal"]>

  export type $AppealPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Appeal"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      caseReference: string
      caseType: string
      procedureType: string
      band: number
      level: number
      siteAddress: string
      location: string
      localPlanningAuthority: string
      region: string
      caseStatus: string
      caseAge: number
      linkedCases: string
      finalCommentsDate: Date
      programmingStatus: string
      programmingNotes: string
      jobDetails: string
      jurisdiction: string
      specialCircumstances: string
      costsAppliedFor: string
      agent: string
      appellant: string
      caseOfficer: string
      lpaPhone: string
      agentphone: string
      appellantPhone: string
      caseOfficerPhone: string
      appealStartDate: Date
      validDate: Date
      eventType: string
      eventDate: Date
      eventStatus: string
      duration: string
      venue: string
    }, ExtArgs["result"]["appeal"]>
    composites: {}
  }

  type AppealGetPayload<S extends boolean | null | undefined | AppealDefaultArgs> = $Result.GetResult<Prisma.$AppealPayload, S>

  type AppealCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AppealFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AppealCountAggregateInputType | true
    }

  export interface AppealDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Appeal'], meta: { name: 'Appeal' } }
    /**
     * Find zero or one Appeal that matches the filter.
     * @param {AppealFindUniqueArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AppealFindUniqueArgs>(args: SelectSubset<T, AppealFindUniqueArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Appeal that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AppealFindUniqueOrThrowArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AppealFindUniqueOrThrowArgs>(args: SelectSubset<T, AppealFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Appeal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealFindFirstArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AppealFindFirstArgs>(args?: SelectSubset<T, AppealFindFirstArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Appeal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealFindFirstOrThrowArgs} args - Arguments to find a Appeal
     * @example
     * // Get one Appeal
     * const appeal = await prisma.appeal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AppealFindFirstOrThrowArgs>(args?: SelectSubset<T, AppealFindFirstOrThrowArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Appeals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Appeals
     * const appeals = await prisma.appeal.findMany()
     * 
     * // Get first 10 Appeals
     * const appeals = await prisma.appeal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const appealWithIdOnly = await prisma.appeal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AppealFindManyArgs>(args?: SelectSubset<T, AppealFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Appeal.
     * @param {AppealCreateArgs} args - Arguments to create a Appeal.
     * @example
     * // Create one Appeal
     * const Appeal = await prisma.appeal.create({
     *   data: {
     *     // ... data to create a Appeal
     *   }
     * })
     * 
     */
    create<T extends AppealCreateArgs>(args: SelectSubset<T, AppealCreateArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Appeals.
     * @param {AppealCreateManyArgs} args - Arguments to create many Appeals.
     * @example
     * // Create many Appeals
     * const appeal = await prisma.appeal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AppealCreateManyArgs>(args?: SelectSubset<T, AppealCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Appeal.
     * @param {AppealDeleteArgs} args - Arguments to delete one Appeal.
     * @example
     * // Delete one Appeal
     * const Appeal = await prisma.appeal.delete({
     *   where: {
     *     // ... filter to delete one Appeal
     *   }
     * })
     * 
     */
    delete<T extends AppealDeleteArgs>(args: SelectSubset<T, AppealDeleteArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Appeal.
     * @param {AppealUpdateArgs} args - Arguments to update one Appeal.
     * @example
     * // Update one Appeal
     * const appeal = await prisma.appeal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AppealUpdateArgs>(args: SelectSubset<T, AppealUpdateArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Appeals.
     * @param {AppealDeleteManyArgs} args - Arguments to filter Appeals to delete.
     * @example
     * // Delete a few Appeals
     * const { count } = await prisma.appeal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AppealDeleteManyArgs>(args?: SelectSubset<T, AppealDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Appeals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Appeals
     * const appeal = await prisma.appeal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AppealUpdateManyArgs>(args: SelectSubset<T, AppealUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Appeal.
     * @param {AppealUpsertArgs} args - Arguments to update or create a Appeal.
     * @example
     * // Update or create a Appeal
     * const appeal = await prisma.appeal.upsert({
     *   create: {
     *     // ... data to create a Appeal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Appeal we want to update
     *   }
     * })
     */
    upsert<T extends AppealUpsertArgs>(args: SelectSubset<T, AppealUpsertArgs<ExtArgs>>): Prisma__AppealClient<$Result.GetResult<Prisma.$AppealPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Appeals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealCountArgs} args - Arguments to filter Appeals to count.
     * @example
     * // Count the number of Appeals
     * const count = await prisma.appeal.count({
     *   where: {
     *     // ... the filter for the Appeals we want to count
     *   }
     * })
    **/
    count<T extends AppealCountArgs>(
      args?: Subset<T, AppealCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AppealCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Appeal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AppealAggregateArgs>(args: Subset<T, AppealAggregateArgs>): Prisma.PrismaPromise<GetAppealAggregateType<T>>

    /**
     * Group by Appeal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AppealGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AppealGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AppealGroupByArgs['orderBy'] }
        : { orderBy?: AppealGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AppealGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAppealGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Appeal model
   */
  readonly fields: AppealFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Appeal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AppealClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Appeal model
   */
  interface AppealFieldRefs {
    readonly id: FieldRef<"Appeal", 'Int'>
    readonly caseReference: FieldRef<"Appeal", 'String'>
    readonly caseType: FieldRef<"Appeal", 'String'>
    readonly procedureType: FieldRef<"Appeal", 'String'>
    readonly band: FieldRef<"Appeal", 'Int'>
    readonly level: FieldRef<"Appeal", 'Int'>
    readonly siteAddress: FieldRef<"Appeal", 'String'>
    readonly location: FieldRef<"Appeal", 'String'>
    readonly localPlanningAuthority: FieldRef<"Appeal", 'String'>
    readonly region: FieldRef<"Appeal", 'String'>
    readonly caseStatus: FieldRef<"Appeal", 'String'>
    readonly caseAge: FieldRef<"Appeal", 'Int'>
    readonly linkedCases: FieldRef<"Appeal", 'String'>
    readonly finalCommentsDate: FieldRef<"Appeal", 'DateTime'>
    readonly programmingStatus: FieldRef<"Appeal", 'String'>
    readonly programmingNotes: FieldRef<"Appeal", 'String'>
    readonly jobDetails: FieldRef<"Appeal", 'String'>
    readonly jurisdiction: FieldRef<"Appeal", 'String'>
    readonly specialCircumstances: FieldRef<"Appeal", 'String'>
    readonly costsAppliedFor: FieldRef<"Appeal", 'String'>
    readonly agent: FieldRef<"Appeal", 'String'>
    readonly appellant: FieldRef<"Appeal", 'String'>
    readonly caseOfficer: FieldRef<"Appeal", 'String'>
    readonly lpaPhone: FieldRef<"Appeal", 'String'>
    readonly agentphone: FieldRef<"Appeal", 'String'>
    readonly appellantPhone: FieldRef<"Appeal", 'String'>
    readonly caseOfficerPhone: FieldRef<"Appeal", 'String'>
    readonly appealStartDate: FieldRef<"Appeal", 'DateTime'>
    readonly validDate: FieldRef<"Appeal", 'DateTime'>
    readonly eventType: FieldRef<"Appeal", 'String'>
    readonly eventDate: FieldRef<"Appeal", 'DateTime'>
    readonly eventStatus: FieldRef<"Appeal", 'String'>
    readonly duration: FieldRef<"Appeal", 'String'>
    readonly venue: FieldRef<"Appeal", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Appeal findUnique
   */
  export type AppealFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal findUniqueOrThrow
   */
  export type AppealFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal findFirst
   */
  export type AppealFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Appeals.
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Appeals.
     */
    distinct?: AppealScalarFieldEnum | AppealScalarFieldEnum[]
  }

  /**
   * Appeal findFirstOrThrow
   */
  export type AppealFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * Filter, which Appeal to fetch.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Appeals.
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Appeals.
     */
    distinct?: AppealScalarFieldEnum | AppealScalarFieldEnum[]
  }

  /**
   * Appeal findMany
   */
  export type AppealFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * Filter, which Appeals to fetch.
     */
    where?: AppealWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Appeals to fetch.
     */
    orderBy?: AppealOrderByWithRelationInput | AppealOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Appeals.
     */
    cursor?: AppealWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Appeals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Appeals.
     */
    skip?: number
    distinct?: AppealScalarFieldEnum | AppealScalarFieldEnum[]
  }

  /**
   * Appeal create
   */
  export type AppealCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * The data needed to create a Appeal.
     */
    data: XOR<AppealCreateInput, AppealUncheckedCreateInput>
  }

  /**
   * Appeal createMany
   */
  export type AppealCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Appeals.
     */
    data: AppealCreateManyInput | AppealCreateManyInput[]
  }

  /**
   * Appeal update
   */
  export type AppealUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * The data needed to update a Appeal.
     */
    data: XOR<AppealUpdateInput, AppealUncheckedUpdateInput>
    /**
     * Choose, which Appeal to update.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal updateMany
   */
  export type AppealUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Appeals.
     */
    data: XOR<AppealUpdateManyMutationInput, AppealUncheckedUpdateManyInput>
    /**
     * Filter which Appeals to update
     */
    where?: AppealWhereInput
    /**
     * Limit how many Appeals to update.
     */
    limit?: number
  }

  /**
   * Appeal upsert
   */
  export type AppealUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * The filter to search for the Appeal to update in case it exists.
     */
    where: AppealWhereUniqueInput
    /**
     * In case the Appeal found by the `where` argument doesn't exist, create a new Appeal with this data.
     */
    create: XOR<AppealCreateInput, AppealUncheckedCreateInput>
    /**
     * In case the Appeal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AppealUpdateInput, AppealUncheckedUpdateInput>
  }

  /**
   * Appeal delete
   */
  export type AppealDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
    /**
     * Filter which Appeal to delete.
     */
    where: AppealWhereUniqueInput
  }

  /**
   * Appeal deleteMany
   */
  export type AppealDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Appeals to delete
     */
    where?: AppealWhereInput
    /**
     * Limit how many Appeals to delete.
     */
    limit?: number
  }

  /**
   * Appeal without action
   */
  export type AppealDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Appeal
     */
    select?: AppealSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Appeal
     */
    omit?: AppealOmit<ExtArgs> | null
  }


  /**
   * Model Inspector
   */

  export type AggregateInspector = {
    _count: InspectorCountAggregateOutputType | null
    _avg: InspectorAvgAggregateOutputType | null
    _sum: InspectorSumAggregateOutputType | null
    _min: InspectorMinAggregateOutputType | null
    _max: InspectorMaxAggregateOutputType | null
  }

  export type InspectorAvgAggregateOutputType = {
    id: number | null
  }

  export type InspectorSumAggregateOutputType = {
    id: number | null
  }

  export type InspectorMinAggregateOutputType = {
    id: number | null
    address: string | null
    workPhone: string | null
    mobilePhone: string | null
    resourceGroup: string | null
    grade: string | null
    fte: string | null
    chartingOfficer: string | null
    chartingOfficerPhone: string | null
    inspectorManager: string | null
    name: string | null
    proficiency: string | null
    validFrom: string | null
    specialisms: string | null
  }

  export type InspectorMaxAggregateOutputType = {
    id: number | null
    address: string | null
    workPhone: string | null
    mobilePhone: string | null
    resourceGroup: string | null
    grade: string | null
    fte: string | null
    chartingOfficer: string | null
    chartingOfficerPhone: string | null
    inspectorManager: string | null
    name: string | null
    proficiency: string | null
    validFrom: string | null
    specialisms: string | null
  }

  export type InspectorCountAggregateOutputType = {
    id: number
    address: number
    workPhone: number
    mobilePhone: number
    resourceGroup: number
    grade: number
    fte: number
    chartingOfficer: number
    chartingOfficerPhone: number
    inspectorManager: number
    name: number
    proficiency: number
    validFrom: number
    specialisms: number
    _all: number
  }


  export type InspectorAvgAggregateInputType = {
    id?: true
  }

  export type InspectorSumAggregateInputType = {
    id?: true
  }

  export type InspectorMinAggregateInputType = {
    id?: true
    address?: true
    workPhone?: true
    mobilePhone?: true
    resourceGroup?: true
    grade?: true
    fte?: true
    chartingOfficer?: true
    chartingOfficerPhone?: true
    inspectorManager?: true
    name?: true
    proficiency?: true
    validFrom?: true
    specialisms?: true
  }

  export type InspectorMaxAggregateInputType = {
    id?: true
    address?: true
    workPhone?: true
    mobilePhone?: true
    resourceGroup?: true
    grade?: true
    fte?: true
    chartingOfficer?: true
    chartingOfficerPhone?: true
    inspectorManager?: true
    name?: true
    proficiency?: true
    validFrom?: true
    specialisms?: true
  }

  export type InspectorCountAggregateInputType = {
    id?: true
    address?: true
    workPhone?: true
    mobilePhone?: true
    resourceGroup?: true
    grade?: true
    fte?: true
    chartingOfficer?: true
    chartingOfficerPhone?: true
    inspectorManager?: true
    name?: true
    proficiency?: true
    validFrom?: true
    specialisms?: true
    _all?: true
  }

  export type InspectorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inspector to aggregate.
     */
    where?: InspectorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspectors to fetch.
     */
    orderBy?: InspectorOrderByWithRelationInput | InspectorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InspectorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspectors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspectors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Inspectors
    **/
    _count?: true | InspectorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InspectorAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InspectorSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InspectorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InspectorMaxAggregateInputType
  }

  export type GetInspectorAggregateType<T extends InspectorAggregateArgs> = {
        [P in keyof T & keyof AggregateInspector]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInspector[P]>
      : GetScalarType<T[P], AggregateInspector[P]>
  }




  export type InspectorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InspectorWhereInput
    orderBy?: InspectorOrderByWithAggregationInput | InspectorOrderByWithAggregationInput[]
    by: InspectorScalarFieldEnum[] | InspectorScalarFieldEnum
    having?: InspectorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InspectorCountAggregateInputType | true
    _avg?: InspectorAvgAggregateInputType
    _sum?: InspectorSumAggregateInputType
    _min?: InspectorMinAggregateInputType
    _max?: InspectorMaxAggregateInputType
  }

  export type InspectorGroupByOutputType = {
    id: number
    address: string
    workPhone: string
    mobilePhone: string
    resourceGroup: string
    grade: string
    fte: string
    chartingOfficer: string
    chartingOfficerPhone: string
    inspectorManager: string
    name: string
    proficiency: string
    validFrom: string
    specialisms: string
    _count: InspectorCountAggregateOutputType | null
    _avg: InspectorAvgAggregateOutputType | null
    _sum: InspectorSumAggregateOutputType | null
    _min: InspectorMinAggregateOutputType | null
    _max: InspectorMaxAggregateOutputType | null
  }

  type GetInspectorGroupByPayload<T extends InspectorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InspectorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InspectorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InspectorGroupByOutputType[P]>
            : GetScalarType<T[P], InspectorGroupByOutputType[P]>
        }
      >
    >


  export type InspectorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    address?: boolean
    workPhone?: boolean
    mobilePhone?: boolean
    resourceGroup?: boolean
    grade?: boolean
    fte?: boolean
    chartingOfficer?: boolean
    chartingOfficerPhone?: boolean
    inspectorManager?: boolean
    name?: boolean
    proficiency?: boolean
    validFrom?: boolean
    specialisms?: boolean
  }, ExtArgs["result"]["inspector"]>



  export type InspectorSelectScalar = {
    id?: boolean
    address?: boolean
    workPhone?: boolean
    mobilePhone?: boolean
    resourceGroup?: boolean
    grade?: boolean
    fte?: boolean
    chartingOfficer?: boolean
    chartingOfficerPhone?: boolean
    inspectorManager?: boolean
    name?: boolean
    proficiency?: boolean
    validFrom?: boolean
    specialisms?: boolean
  }

  export type InspectorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "address" | "workPhone" | "mobilePhone" | "resourceGroup" | "grade" | "fte" | "chartingOfficer" | "chartingOfficerPhone" | "inspectorManager" | "name" | "proficiency" | "validFrom" | "specialisms", ExtArgs["result"]["inspector"]>

  export type $InspectorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Inspector"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      address: string
      workPhone: string
      mobilePhone: string
      resourceGroup: string
      grade: string
      fte: string
      chartingOfficer: string
      chartingOfficerPhone: string
      inspectorManager: string
      name: string
      proficiency: string
      validFrom: string
      specialisms: string
    }, ExtArgs["result"]["inspector"]>
    composites: {}
  }

  type InspectorGetPayload<S extends boolean | null | undefined | InspectorDefaultArgs> = $Result.GetResult<Prisma.$InspectorPayload, S>

  type InspectorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InspectorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InspectorCountAggregateInputType | true
    }

  export interface InspectorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Inspector'], meta: { name: 'Inspector' } }
    /**
     * Find zero or one Inspector that matches the filter.
     * @param {InspectorFindUniqueArgs} args - Arguments to find a Inspector
     * @example
     * // Get one Inspector
     * const inspector = await prisma.inspector.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InspectorFindUniqueArgs>(args: SelectSubset<T, InspectorFindUniqueArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Inspector that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InspectorFindUniqueOrThrowArgs} args - Arguments to find a Inspector
     * @example
     * // Get one Inspector
     * const inspector = await prisma.inspector.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InspectorFindUniqueOrThrowArgs>(args: SelectSubset<T, InspectorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inspector that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectorFindFirstArgs} args - Arguments to find a Inspector
     * @example
     * // Get one Inspector
     * const inspector = await prisma.inspector.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InspectorFindFirstArgs>(args?: SelectSubset<T, InspectorFindFirstArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inspector that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectorFindFirstOrThrowArgs} args - Arguments to find a Inspector
     * @example
     * // Get one Inspector
     * const inspector = await prisma.inspector.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InspectorFindFirstOrThrowArgs>(args?: SelectSubset<T, InspectorFindFirstOrThrowArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Inspectors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Inspectors
     * const inspectors = await prisma.inspector.findMany()
     * 
     * // Get first 10 Inspectors
     * const inspectors = await prisma.inspector.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inspectorWithIdOnly = await prisma.inspector.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InspectorFindManyArgs>(args?: SelectSubset<T, InspectorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Inspector.
     * @param {InspectorCreateArgs} args - Arguments to create a Inspector.
     * @example
     * // Create one Inspector
     * const Inspector = await prisma.inspector.create({
     *   data: {
     *     // ... data to create a Inspector
     *   }
     * })
     * 
     */
    create<T extends InspectorCreateArgs>(args: SelectSubset<T, InspectorCreateArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Inspectors.
     * @param {InspectorCreateManyArgs} args - Arguments to create many Inspectors.
     * @example
     * // Create many Inspectors
     * const inspector = await prisma.inspector.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InspectorCreateManyArgs>(args?: SelectSubset<T, InspectorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Inspector.
     * @param {InspectorDeleteArgs} args - Arguments to delete one Inspector.
     * @example
     * // Delete one Inspector
     * const Inspector = await prisma.inspector.delete({
     *   where: {
     *     // ... filter to delete one Inspector
     *   }
     * })
     * 
     */
    delete<T extends InspectorDeleteArgs>(args: SelectSubset<T, InspectorDeleteArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Inspector.
     * @param {InspectorUpdateArgs} args - Arguments to update one Inspector.
     * @example
     * // Update one Inspector
     * const inspector = await prisma.inspector.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InspectorUpdateArgs>(args: SelectSubset<T, InspectorUpdateArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Inspectors.
     * @param {InspectorDeleteManyArgs} args - Arguments to filter Inspectors to delete.
     * @example
     * // Delete a few Inspectors
     * const { count } = await prisma.inspector.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InspectorDeleteManyArgs>(args?: SelectSubset<T, InspectorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inspectors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Inspectors
     * const inspector = await prisma.inspector.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InspectorUpdateManyArgs>(args: SelectSubset<T, InspectorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Inspector.
     * @param {InspectorUpsertArgs} args - Arguments to update or create a Inspector.
     * @example
     * // Update or create a Inspector
     * const inspector = await prisma.inspector.upsert({
     *   create: {
     *     // ... data to create a Inspector
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Inspector we want to update
     *   }
     * })
     */
    upsert<T extends InspectorUpsertArgs>(args: SelectSubset<T, InspectorUpsertArgs<ExtArgs>>): Prisma__InspectorClient<$Result.GetResult<Prisma.$InspectorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Inspectors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectorCountArgs} args - Arguments to filter Inspectors to count.
     * @example
     * // Count the number of Inspectors
     * const count = await prisma.inspector.count({
     *   where: {
     *     // ... the filter for the Inspectors we want to count
     *   }
     * })
    **/
    count<T extends InspectorCountArgs>(
      args?: Subset<T, InspectorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InspectorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Inspector.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InspectorAggregateArgs>(args: Subset<T, InspectorAggregateArgs>): Prisma.PrismaPromise<GetInspectorAggregateType<T>>

    /**
     * Group by Inspector.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InspectorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InspectorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InspectorGroupByArgs['orderBy'] }
        : { orderBy?: InspectorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InspectorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInspectorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Inspector model
   */
  readonly fields: InspectorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Inspector.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InspectorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Inspector model
   */
  interface InspectorFieldRefs {
    readonly id: FieldRef<"Inspector", 'Int'>
    readonly address: FieldRef<"Inspector", 'String'>
    readonly workPhone: FieldRef<"Inspector", 'String'>
    readonly mobilePhone: FieldRef<"Inspector", 'String'>
    readonly resourceGroup: FieldRef<"Inspector", 'String'>
    readonly grade: FieldRef<"Inspector", 'String'>
    readonly fte: FieldRef<"Inspector", 'String'>
    readonly chartingOfficer: FieldRef<"Inspector", 'String'>
    readonly chartingOfficerPhone: FieldRef<"Inspector", 'String'>
    readonly inspectorManager: FieldRef<"Inspector", 'String'>
    readonly name: FieldRef<"Inspector", 'String'>
    readonly proficiency: FieldRef<"Inspector", 'String'>
    readonly validFrom: FieldRef<"Inspector", 'String'>
    readonly specialisms: FieldRef<"Inspector", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Inspector findUnique
   */
  export type InspectorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * Filter, which Inspector to fetch.
     */
    where: InspectorWhereUniqueInput
  }

  /**
   * Inspector findUniqueOrThrow
   */
  export type InspectorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * Filter, which Inspector to fetch.
     */
    where: InspectorWhereUniqueInput
  }

  /**
   * Inspector findFirst
   */
  export type InspectorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * Filter, which Inspector to fetch.
     */
    where?: InspectorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspectors to fetch.
     */
    orderBy?: InspectorOrderByWithRelationInput | InspectorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inspectors.
     */
    cursor?: InspectorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspectors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspectors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inspectors.
     */
    distinct?: InspectorScalarFieldEnum | InspectorScalarFieldEnum[]
  }

  /**
   * Inspector findFirstOrThrow
   */
  export type InspectorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * Filter, which Inspector to fetch.
     */
    where?: InspectorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspectors to fetch.
     */
    orderBy?: InspectorOrderByWithRelationInput | InspectorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inspectors.
     */
    cursor?: InspectorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspectors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspectors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inspectors.
     */
    distinct?: InspectorScalarFieldEnum | InspectorScalarFieldEnum[]
  }

  /**
   * Inspector findMany
   */
  export type InspectorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * Filter, which Inspectors to fetch.
     */
    where?: InspectorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inspectors to fetch.
     */
    orderBy?: InspectorOrderByWithRelationInput | InspectorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Inspectors.
     */
    cursor?: InspectorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inspectors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inspectors.
     */
    skip?: number
    distinct?: InspectorScalarFieldEnum | InspectorScalarFieldEnum[]
  }

  /**
   * Inspector create
   */
  export type InspectorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * The data needed to create a Inspector.
     */
    data: XOR<InspectorCreateInput, InspectorUncheckedCreateInput>
  }

  /**
   * Inspector createMany
   */
  export type InspectorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Inspectors.
     */
    data: InspectorCreateManyInput | InspectorCreateManyInput[]
  }

  /**
   * Inspector update
   */
  export type InspectorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * The data needed to update a Inspector.
     */
    data: XOR<InspectorUpdateInput, InspectorUncheckedUpdateInput>
    /**
     * Choose, which Inspector to update.
     */
    where: InspectorWhereUniqueInput
  }

  /**
   * Inspector updateMany
   */
  export type InspectorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Inspectors.
     */
    data: XOR<InspectorUpdateManyMutationInput, InspectorUncheckedUpdateManyInput>
    /**
     * Filter which Inspectors to update
     */
    where?: InspectorWhereInput
    /**
     * Limit how many Inspectors to update.
     */
    limit?: number
  }

  /**
   * Inspector upsert
   */
  export type InspectorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * The filter to search for the Inspector to update in case it exists.
     */
    where: InspectorWhereUniqueInput
    /**
     * In case the Inspector found by the `where` argument doesn't exist, create a new Inspector with this data.
     */
    create: XOR<InspectorCreateInput, InspectorUncheckedCreateInput>
    /**
     * In case the Inspector was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InspectorUpdateInput, InspectorUncheckedUpdateInput>
  }

  /**
   * Inspector delete
   */
  export type InspectorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
    /**
     * Filter which Inspector to delete.
     */
    where: InspectorWhereUniqueInput
  }

  /**
   * Inspector deleteMany
   */
  export type InspectorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inspectors to delete
     */
    where?: InspectorWhereInput
    /**
     * Limit how many Inspectors to delete.
     */
    limit?: number
  }

  /**
   * Inspector without action
   */
  export type InspectorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inspector
     */
    select?: InspectorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inspector
     */
    omit?: InspectorOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable',
    Snapshot: 'Snapshot'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AppealScalarFieldEnum: {
    id: 'id',
    caseReference: 'caseReference',
    caseType: 'caseType',
    procedureType: 'procedureType',
    band: 'band',
    level: 'level',
    siteAddress: 'siteAddress',
    location: 'location',
    localPlanningAuthority: 'localPlanningAuthority',
    region: 'region',
    caseStatus: 'caseStatus',
    caseAge: 'caseAge',
    linkedCases: 'linkedCases',
    finalCommentsDate: 'finalCommentsDate',
    programmingStatus: 'programmingStatus',
    programmingNotes: 'programmingNotes',
    jobDetails: 'jobDetails',
    jurisdiction: 'jurisdiction',
    specialCircumstances: 'specialCircumstances',
    costsAppliedFor: 'costsAppliedFor',
    agent: 'agent',
    appellant: 'appellant',
    caseOfficer: 'caseOfficer',
    lpaPhone: 'lpaPhone',
    agentphone: 'agentphone',
    appellantPhone: 'appellantPhone',
    caseOfficerPhone: 'caseOfficerPhone',
    appealStartDate: 'appealStartDate',
    validDate: 'validDate',
    eventType: 'eventType',
    eventDate: 'eventDate',
    eventStatus: 'eventStatus',
    duration: 'duration',
    venue: 'venue'
  };

  export type AppealScalarFieldEnum = (typeof AppealScalarFieldEnum)[keyof typeof AppealScalarFieldEnum]


  export const InspectorScalarFieldEnum: {
    id: 'id',
    address: 'address',
    workPhone: 'workPhone',
    mobilePhone: 'mobilePhone',
    resourceGroup: 'resourceGroup',
    grade: 'grade',
    fte: 'fte',
    chartingOfficer: 'chartingOfficer',
    chartingOfficerPhone: 'chartingOfficerPhone',
    inspectorManager: 'inspectorManager',
    name: 'name',
    proficiency: 'proficiency',
    validFrom: 'validFrom',
    specialisms: 'specialisms'
  };

  export type InspectorScalarFieldEnum = (typeof InspectorScalarFieldEnum)[keyof typeof InspectorScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type AppealWhereInput = {
    AND?: AppealWhereInput | AppealWhereInput[]
    OR?: AppealWhereInput[]
    NOT?: AppealWhereInput | AppealWhereInput[]
    id?: IntFilter<"Appeal"> | number
    caseReference?: StringFilter<"Appeal"> | string
    caseType?: StringFilter<"Appeal"> | string
    procedureType?: StringFilter<"Appeal"> | string
    band?: IntFilter<"Appeal"> | number
    level?: IntFilter<"Appeal"> | number
    siteAddress?: StringFilter<"Appeal"> | string
    location?: StringFilter<"Appeal"> | string
    localPlanningAuthority?: StringFilter<"Appeal"> | string
    region?: StringFilter<"Appeal"> | string
    caseStatus?: StringFilter<"Appeal"> | string
    caseAge?: IntFilter<"Appeal"> | number
    linkedCases?: StringFilter<"Appeal"> | string
    finalCommentsDate?: DateTimeFilter<"Appeal"> | Date | string
    programmingStatus?: StringFilter<"Appeal"> | string
    programmingNotes?: StringFilter<"Appeal"> | string
    jobDetails?: StringFilter<"Appeal"> | string
    jurisdiction?: StringFilter<"Appeal"> | string
    specialCircumstances?: StringFilter<"Appeal"> | string
    costsAppliedFor?: StringFilter<"Appeal"> | string
    agent?: StringFilter<"Appeal"> | string
    appellant?: StringFilter<"Appeal"> | string
    caseOfficer?: StringFilter<"Appeal"> | string
    lpaPhone?: StringFilter<"Appeal"> | string
    agentphone?: StringFilter<"Appeal"> | string
    appellantPhone?: StringFilter<"Appeal"> | string
    caseOfficerPhone?: StringFilter<"Appeal"> | string
    appealStartDate?: DateTimeFilter<"Appeal"> | Date | string
    validDate?: DateTimeFilter<"Appeal"> | Date | string
    eventType?: StringFilter<"Appeal"> | string
    eventDate?: DateTimeFilter<"Appeal"> | Date | string
    eventStatus?: StringFilter<"Appeal"> | string
    duration?: StringFilter<"Appeal"> | string
    venue?: StringFilter<"Appeal"> | string
  }

  export type AppealOrderByWithRelationInput = {
    id?: SortOrder
    caseReference?: SortOrder
    caseType?: SortOrder
    procedureType?: SortOrder
    band?: SortOrder
    level?: SortOrder
    siteAddress?: SortOrder
    location?: SortOrder
    localPlanningAuthority?: SortOrder
    region?: SortOrder
    caseStatus?: SortOrder
    caseAge?: SortOrder
    linkedCases?: SortOrder
    finalCommentsDate?: SortOrder
    programmingStatus?: SortOrder
    programmingNotes?: SortOrder
    jobDetails?: SortOrder
    jurisdiction?: SortOrder
    specialCircumstances?: SortOrder
    costsAppliedFor?: SortOrder
    agent?: SortOrder
    appellant?: SortOrder
    caseOfficer?: SortOrder
    lpaPhone?: SortOrder
    agentphone?: SortOrder
    appellantPhone?: SortOrder
    caseOfficerPhone?: SortOrder
    appealStartDate?: SortOrder
    validDate?: SortOrder
    eventType?: SortOrder
    eventDate?: SortOrder
    eventStatus?: SortOrder
    duration?: SortOrder
    venue?: SortOrder
  }

  export type AppealWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: AppealWhereInput | AppealWhereInput[]
    OR?: AppealWhereInput[]
    NOT?: AppealWhereInput | AppealWhereInput[]
    caseReference?: StringFilter<"Appeal"> | string
    caseType?: StringFilter<"Appeal"> | string
    procedureType?: StringFilter<"Appeal"> | string
    band?: IntFilter<"Appeal"> | number
    level?: IntFilter<"Appeal"> | number
    siteAddress?: StringFilter<"Appeal"> | string
    location?: StringFilter<"Appeal"> | string
    localPlanningAuthority?: StringFilter<"Appeal"> | string
    region?: StringFilter<"Appeal"> | string
    caseStatus?: StringFilter<"Appeal"> | string
    caseAge?: IntFilter<"Appeal"> | number
    linkedCases?: StringFilter<"Appeal"> | string
    finalCommentsDate?: DateTimeFilter<"Appeal"> | Date | string
    programmingStatus?: StringFilter<"Appeal"> | string
    programmingNotes?: StringFilter<"Appeal"> | string
    jobDetails?: StringFilter<"Appeal"> | string
    jurisdiction?: StringFilter<"Appeal"> | string
    specialCircumstances?: StringFilter<"Appeal"> | string
    costsAppliedFor?: StringFilter<"Appeal"> | string
    agent?: StringFilter<"Appeal"> | string
    appellant?: StringFilter<"Appeal"> | string
    caseOfficer?: StringFilter<"Appeal"> | string
    lpaPhone?: StringFilter<"Appeal"> | string
    agentphone?: StringFilter<"Appeal"> | string
    appellantPhone?: StringFilter<"Appeal"> | string
    caseOfficerPhone?: StringFilter<"Appeal"> | string
    appealStartDate?: DateTimeFilter<"Appeal"> | Date | string
    validDate?: DateTimeFilter<"Appeal"> | Date | string
    eventType?: StringFilter<"Appeal"> | string
    eventDate?: DateTimeFilter<"Appeal"> | Date | string
    eventStatus?: StringFilter<"Appeal"> | string
    duration?: StringFilter<"Appeal"> | string
    venue?: StringFilter<"Appeal"> | string
  }, "id">

  export type AppealOrderByWithAggregationInput = {
    id?: SortOrder
    caseReference?: SortOrder
    caseType?: SortOrder
    procedureType?: SortOrder
    band?: SortOrder
    level?: SortOrder
    siteAddress?: SortOrder
    location?: SortOrder
    localPlanningAuthority?: SortOrder
    region?: SortOrder
    caseStatus?: SortOrder
    caseAge?: SortOrder
    linkedCases?: SortOrder
    finalCommentsDate?: SortOrder
    programmingStatus?: SortOrder
    programmingNotes?: SortOrder
    jobDetails?: SortOrder
    jurisdiction?: SortOrder
    specialCircumstances?: SortOrder
    costsAppliedFor?: SortOrder
    agent?: SortOrder
    appellant?: SortOrder
    caseOfficer?: SortOrder
    lpaPhone?: SortOrder
    agentphone?: SortOrder
    appellantPhone?: SortOrder
    caseOfficerPhone?: SortOrder
    appealStartDate?: SortOrder
    validDate?: SortOrder
    eventType?: SortOrder
    eventDate?: SortOrder
    eventStatus?: SortOrder
    duration?: SortOrder
    venue?: SortOrder
    _count?: AppealCountOrderByAggregateInput
    _avg?: AppealAvgOrderByAggregateInput
    _max?: AppealMaxOrderByAggregateInput
    _min?: AppealMinOrderByAggregateInput
    _sum?: AppealSumOrderByAggregateInput
  }

  export type AppealScalarWhereWithAggregatesInput = {
    AND?: AppealScalarWhereWithAggregatesInput | AppealScalarWhereWithAggregatesInput[]
    OR?: AppealScalarWhereWithAggregatesInput[]
    NOT?: AppealScalarWhereWithAggregatesInput | AppealScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Appeal"> | number
    caseReference?: StringWithAggregatesFilter<"Appeal"> | string
    caseType?: StringWithAggregatesFilter<"Appeal"> | string
    procedureType?: StringWithAggregatesFilter<"Appeal"> | string
    band?: IntWithAggregatesFilter<"Appeal"> | number
    level?: IntWithAggregatesFilter<"Appeal"> | number
    siteAddress?: StringWithAggregatesFilter<"Appeal"> | string
    location?: StringWithAggregatesFilter<"Appeal"> | string
    localPlanningAuthority?: StringWithAggregatesFilter<"Appeal"> | string
    region?: StringWithAggregatesFilter<"Appeal"> | string
    caseStatus?: StringWithAggregatesFilter<"Appeal"> | string
    caseAge?: IntWithAggregatesFilter<"Appeal"> | number
    linkedCases?: StringWithAggregatesFilter<"Appeal"> | string
    finalCommentsDate?: DateTimeWithAggregatesFilter<"Appeal"> | Date | string
    programmingStatus?: StringWithAggregatesFilter<"Appeal"> | string
    programmingNotes?: StringWithAggregatesFilter<"Appeal"> | string
    jobDetails?: StringWithAggregatesFilter<"Appeal"> | string
    jurisdiction?: StringWithAggregatesFilter<"Appeal"> | string
    specialCircumstances?: StringWithAggregatesFilter<"Appeal"> | string
    costsAppliedFor?: StringWithAggregatesFilter<"Appeal"> | string
    agent?: StringWithAggregatesFilter<"Appeal"> | string
    appellant?: StringWithAggregatesFilter<"Appeal"> | string
    caseOfficer?: StringWithAggregatesFilter<"Appeal"> | string
    lpaPhone?: StringWithAggregatesFilter<"Appeal"> | string
    agentphone?: StringWithAggregatesFilter<"Appeal"> | string
    appellantPhone?: StringWithAggregatesFilter<"Appeal"> | string
    caseOfficerPhone?: StringWithAggregatesFilter<"Appeal"> | string
    appealStartDate?: DateTimeWithAggregatesFilter<"Appeal"> | Date | string
    validDate?: DateTimeWithAggregatesFilter<"Appeal"> | Date | string
    eventType?: StringWithAggregatesFilter<"Appeal"> | string
    eventDate?: DateTimeWithAggregatesFilter<"Appeal"> | Date | string
    eventStatus?: StringWithAggregatesFilter<"Appeal"> | string
    duration?: StringWithAggregatesFilter<"Appeal"> | string
    venue?: StringWithAggregatesFilter<"Appeal"> | string
  }

  export type InspectorWhereInput = {
    AND?: InspectorWhereInput | InspectorWhereInput[]
    OR?: InspectorWhereInput[]
    NOT?: InspectorWhereInput | InspectorWhereInput[]
    id?: IntFilter<"Inspector"> | number
    address?: StringFilter<"Inspector"> | string
    workPhone?: StringFilter<"Inspector"> | string
    mobilePhone?: StringFilter<"Inspector"> | string
    resourceGroup?: StringFilter<"Inspector"> | string
    grade?: StringFilter<"Inspector"> | string
    fte?: StringFilter<"Inspector"> | string
    chartingOfficer?: StringFilter<"Inspector"> | string
    chartingOfficerPhone?: StringFilter<"Inspector"> | string
    inspectorManager?: StringFilter<"Inspector"> | string
    name?: StringFilter<"Inspector"> | string
    proficiency?: StringFilter<"Inspector"> | string
    validFrom?: StringFilter<"Inspector"> | string
    specialisms?: StringFilter<"Inspector"> | string
  }

  export type InspectorOrderByWithRelationInput = {
    id?: SortOrder
    address?: SortOrder
    workPhone?: SortOrder
    mobilePhone?: SortOrder
    resourceGroup?: SortOrder
    grade?: SortOrder
    fte?: SortOrder
    chartingOfficer?: SortOrder
    chartingOfficerPhone?: SortOrder
    inspectorManager?: SortOrder
    name?: SortOrder
    proficiency?: SortOrder
    validFrom?: SortOrder
    specialisms?: SortOrder
  }

  export type InspectorWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: InspectorWhereInput | InspectorWhereInput[]
    OR?: InspectorWhereInput[]
    NOT?: InspectorWhereInput | InspectorWhereInput[]
    address?: StringFilter<"Inspector"> | string
    workPhone?: StringFilter<"Inspector"> | string
    mobilePhone?: StringFilter<"Inspector"> | string
    resourceGroup?: StringFilter<"Inspector"> | string
    grade?: StringFilter<"Inspector"> | string
    fte?: StringFilter<"Inspector"> | string
    chartingOfficer?: StringFilter<"Inspector"> | string
    chartingOfficerPhone?: StringFilter<"Inspector"> | string
    inspectorManager?: StringFilter<"Inspector"> | string
    name?: StringFilter<"Inspector"> | string
    proficiency?: StringFilter<"Inspector"> | string
    validFrom?: StringFilter<"Inspector"> | string
    specialisms?: StringFilter<"Inspector"> | string
  }, "id">

  export type InspectorOrderByWithAggregationInput = {
    id?: SortOrder
    address?: SortOrder
    workPhone?: SortOrder
    mobilePhone?: SortOrder
    resourceGroup?: SortOrder
    grade?: SortOrder
    fte?: SortOrder
    chartingOfficer?: SortOrder
    chartingOfficerPhone?: SortOrder
    inspectorManager?: SortOrder
    name?: SortOrder
    proficiency?: SortOrder
    validFrom?: SortOrder
    specialisms?: SortOrder
    _count?: InspectorCountOrderByAggregateInput
    _avg?: InspectorAvgOrderByAggregateInput
    _max?: InspectorMaxOrderByAggregateInput
    _min?: InspectorMinOrderByAggregateInput
    _sum?: InspectorSumOrderByAggregateInput
  }

  export type InspectorScalarWhereWithAggregatesInput = {
    AND?: InspectorScalarWhereWithAggregatesInput | InspectorScalarWhereWithAggregatesInput[]
    OR?: InspectorScalarWhereWithAggregatesInput[]
    NOT?: InspectorScalarWhereWithAggregatesInput | InspectorScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Inspector"> | number
    address?: StringWithAggregatesFilter<"Inspector"> | string
    workPhone?: StringWithAggregatesFilter<"Inspector"> | string
    mobilePhone?: StringWithAggregatesFilter<"Inspector"> | string
    resourceGroup?: StringWithAggregatesFilter<"Inspector"> | string
    grade?: StringWithAggregatesFilter<"Inspector"> | string
    fte?: StringWithAggregatesFilter<"Inspector"> | string
    chartingOfficer?: StringWithAggregatesFilter<"Inspector"> | string
    chartingOfficerPhone?: StringWithAggregatesFilter<"Inspector"> | string
    inspectorManager?: StringWithAggregatesFilter<"Inspector"> | string
    name?: StringWithAggregatesFilter<"Inspector"> | string
    proficiency?: StringWithAggregatesFilter<"Inspector"> | string
    validFrom?: StringWithAggregatesFilter<"Inspector"> | string
    specialisms?: StringWithAggregatesFilter<"Inspector"> | string
  }

  export type AppealCreateInput = {
    caseReference: string
    caseType: string
    procedureType: string
    band: number
    level: number
    siteAddress: string
    location: string
    localPlanningAuthority: string
    region: string
    caseStatus: string
    caseAge: number
    linkedCases: string
    finalCommentsDate: Date | string
    programmingStatus: string
    programmingNotes: string
    jobDetails: string
    jurisdiction: string
    specialCircumstances: string
    costsAppliedFor: string
    agent: string
    appellant: string
    caseOfficer: string
    lpaPhone: string
    agentphone: string
    appellantPhone: string
    caseOfficerPhone: string
    appealStartDate: Date | string
    validDate: Date | string
    eventType: string
    eventDate: Date | string
    eventStatus: string
    duration: string
    venue: string
  }

  export type AppealUncheckedCreateInput = {
    id?: number
    caseReference: string
    caseType: string
    procedureType: string
    band: number
    level: number
    siteAddress: string
    location: string
    localPlanningAuthority: string
    region: string
    caseStatus: string
    caseAge: number
    linkedCases: string
    finalCommentsDate: Date | string
    programmingStatus: string
    programmingNotes: string
    jobDetails: string
    jurisdiction: string
    specialCircumstances: string
    costsAppliedFor: string
    agent: string
    appellant: string
    caseOfficer: string
    lpaPhone: string
    agentphone: string
    appellantPhone: string
    caseOfficerPhone: string
    appealStartDate: Date | string
    validDate: Date | string
    eventType: string
    eventDate: Date | string
    eventStatus: string
    duration: string
    venue: string
  }

  export type AppealUpdateInput = {
    caseReference?: StringFieldUpdateOperationsInput | string
    caseType?: StringFieldUpdateOperationsInput | string
    procedureType?: StringFieldUpdateOperationsInput | string
    band?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    siteAddress?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    localPlanningAuthority?: StringFieldUpdateOperationsInput | string
    region?: StringFieldUpdateOperationsInput | string
    caseStatus?: StringFieldUpdateOperationsInput | string
    caseAge?: IntFieldUpdateOperationsInput | number
    linkedCases?: StringFieldUpdateOperationsInput | string
    finalCommentsDate?: DateTimeFieldUpdateOperationsInput | Date | string
    programmingStatus?: StringFieldUpdateOperationsInput | string
    programmingNotes?: StringFieldUpdateOperationsInput | string
    jobDetails?: StringFieldUpdateOperationsInput | string
    jurisdiction?: StringFieldUpdateOperationsInput | string
    specialCircumstances?: StringFieldUpdateOperationsInput | string
    costsAppliedFor?: StringFieldUpdateOperationsInput | string
    agent?: StringFieldUpdateOperationsInput | string
    appellant?: StringFieldUpdateOperationsInput | string
    caseOfficer?: StringFieldUpdateOperationsInput | string
    lpaPhone?: StringFieldUpdateOperationsInput | string
    agentphone?: StringFieldUpdateOperationsInput | string
    appellantPhone?: StringFieldUpdateOperationsInput | string
    caseOfficerPhone?: StringFieldUpdateOperationsInput | string
    appealStartDate?: DateTimeFieldUpdateOperationsInput | Date | string
    validDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventStatus?: StringFieldUpdateOperationsInput | string
    duration?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
  }

  export type AppealUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    caseReference?: StringFieldUpdateOperationsInput | string
    caseType?: StringFieldUpdateOperationsInput | string
    procedureType?: StringFieldUpdateOperationsInput | string
    band?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    siteAddress?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    localPlanningAuthority?: StringFieldUpdateOperationsInput | string
    region?: StringFieldUpdateOperationsInput | string
    caseStatus?: StringFieldUpdateOperationsInput | string
    caseAge?: IntFieldUpdateOperationsInput | number
    linkedCases?: StringFieldUpdateOperationsInput | string
    finalCommentsDate?: DateTimeFieldUpdateOperationsInput | Date | string
    programmingStatus?: StringFieldUpdateOperationsInput | string
    programmingNotes?: StringFieldUpdateOperationsInput | string
    jobDetails?: StringFieldUpdateOperationsInput | string
    jurisdiction?: StringFieldUpdateOperationsInput | string
    specialCircumstances?: StringFieldUpdateOperationsInput | string
    costsAppliedFor?: StringFieldUpdateOperationsInput | string
    agent?: StringFieldUpdateOperationsInput | string
    appellant?: StringFieldUpdateOperationsInput | string
    caseOfficer?: StringFieldUpdateOperationsInput | string
    lpaPhone?: StringFieldUpdateOperationsInput | string
    agentphone?: StringFieldUpdateOperationsInput | string
    appellantPhone?: StringFieldUpdateOperationsInput | string
    caseOfficerPhone?: StringFieldUpdateOperationsInput | string
    appealStartDate?: DateTimeFieldUpdateOperationsInput | Date | string
    validDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventStatus?: StringFieldUpdateOperationsInput | string
    duration?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
  }

  export type AppealCreateManyInput = {
    caseReference: string
    caseType: string
    procedureType: string
    band: number
    level: number
    siteAddress: string
    location: string
    localPlanningAuthority: string
    region: string
    caseStatus: string
    caseAge: number
    linkedCases: string
    finalCommentsDate: Date | string
    programmingStatus: string
    programmingNotes: string
    jobDetails: string
    jurisdiction: string
    specialCircumstances: string
    costsAppliedFor: string
    agent: string
    appellant: string
    caseOfficer: string
    lpaPhone: string
    agentphone: string
    appellantPhone: string
    caseOfficerPhone: string
    appealStartDate: Date | string
    validDate: Date | string
    eventType: string
    eventDate: Date | string
    eventStatus: string
    duration: string
    venue: string
  }

  export type AppealUpdateManyMutationInput = {
    caseReference?: StringFieldUpdateOperationsInput | string
    caseType?: StringFieldUpdateOperationsInput | string
    procedureType?: StringFieldUpdateOperationsInput | string
    band?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    siteAddress?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    localPlanningAuthority?: StringFieldUpdateOperationsInput | string
    region?: StringFieldUpdateOperationsInput | string
    caseStatus?: StringFieldUpdateOperationsInput | string
    caseAge?: IntFieldUpdateOperationsInput | number
    linkedCases?: StringFieldUpdateOperationsInput | string
    finalCommentsDate?: DateTimeFieldUpdateOperationsInput | Date | string
    programmingStatus?: StringFieldUpdateOperationsInput | string
    programmingNotes?: StringFieldUpdateOperationsInput | string
    jobDetails?: StringFieldUpdateOperationsInput | string
    jurisdiction?: StringFieldUpdateOperationsInput | string
    specialCircumstances?: StringFieldUpdateOperationsInput | string
    costsAppliedFor?: StringFieldUpdateOperationsInput | string
    agent?: StringFieldUpdateOperationsInput | string
    appellant?: StringFieldUpdateOperationsInput | string
    caseOfficer?: StringFieldUpdateOperationsInput | string
    lpaPhone?: StringFieldUpdateOperationsInput | string
    agentphone?: StringFieldUpdateOperationsInput | string
    appellantPhone?: StringFieldUpdateOperationsInput | string
    caseOfficerPhone?: StringFieldUpdateOperationsInput | string
    appealStartDate?: DateTimeFieldUpdateOperationsInput | Date | string
    validDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventStatus?: StringFieldUpdateOperationsInput | string
    duration?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
  }

  export type AppealUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    caseReference?: StringFieldUpdateOperationsInput | string
    caseType?: StringFieldUpdateOperationsInput | string
    procedureType?: StringFieldUpdateOperationsInput | string
    band?: IntFieldUpdateOperationsInput | number
    level?: IntFieldUpdateOperationsInput | number
    siteAddress?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    localPlanningAuthority?: StringFieldUpdateOperationsInput | string
    region?: StringFieldUpdateOperationsInput | string
    caseStatus?: StringFieldUpdateOperationsInput | string
    caseAge?: IntFieldUpdateOperationsInput | number
    linkedCases?: StringFieldUpdateOperationsInput | string
    finalCommentsDate?: DateTimeFieldUpdateOperationsInput | Date | string
    programmingStatus?: StringFieldUpdateOperationsInput | string
    programmingNotes?: StringFieldUpdateOperationsInput | string
    jobDetails?: StringFieldUpdateOperationsInput | string
    jurisdiction?: StringFieldUpdateOperationsInput | string
    specialCircumstances?: StringFieldUpdateOperationsInput | string
    costsAppliedFor?: StringFieldUpdateOperationsInput | string
    agent?: StringFieldUpdateOperationsInput | string
    appellant?: StringFieldUpdateOperationsInput | string
    caseOfficer?: StringFieldUpdateOperationsInput | string
    lpaPhone?: StringFieldUpdateOperationsInput | string
    agentphone?: StringFieldUpdateOperationsInput | string
    appellantPhone?: StringFieldUpdateOperationsInput | string
    caseOfficerPhone?: StringFieldUpdateOperationsInput | string
    appealStartDate?: DateTimeFieldUpdateOperationsInput | Date | string
    validDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventType?: StringFieldUpdateOperationsInput | string
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    eventStatus?: StringFieldUpdateOperationsInput | string
    duration?: StringFieldUpdateOperationsInput | string
    venue?: StringFieldUpdateOperationsInput | string
  }

  export type InspectorCreateInput = {
    address: string
    workPhone: string
    mobilePhone: string
    resourceGroup: string
    grade: string
    fte: string
    chartingOfficer: string
    chartingOfficerPhone: string
    inspectorManager: string
    name: string
    proficiency: string
    validFrom: string
    specialisms: string
  }

  export type InspectorUncheckedCreateInput = {
    id?: number
    address: string
    workPhone: string
    mobilePhone: string
    resourceGroup: string
    grade: string
    fte: string
    chartingOfficer: string
    chartingOfficerPhone: string
    inspectorManager: string
    name: string
    proficiency: string
    validFrom: string
    specialisms: string
  }

  export type InspectorUpdateInput = {
    address?: StringFieldUpdateOperationsInput | string
    workPhone?: StringFieldUpdateOperationsInput | string
    mobilePhone?: StringFieldUpdateOperationsInput | string
    resourceGroup?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    fte?: StringFieldUpdateOperationsInput | string
    chartingOfficer?: StringFieldUpdateOperationsInput | string
    chartingOfficerPhone?: StringFieldUpdateOperationsInput | string
    inspectorManager?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    proficiency?: StringFieldUpdateOperationsInput | string
    validFrom?: StringFieldUpdateOperationsInput | string
    specialisms?: StringFieldUpdateOperationsInput | string
  }

  export type InspectorUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    address?: StringFieldUpdateOperationsInput | string
    workPhone?: StringFieldUpdateOperationsInput | string
    mobilePhone?: StringFieldUpdateOperationsInput | string
    resourceGroup?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    fte?: StringFieldUpdateOperationsInput | string
    chartingOfficer?: StringFieldUpdateOperationsInput | string
    chartingOfficerPhone?: StringFieldUpdateOperationsInput | string
    inspectorManager?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    proficiency?: StringFieldUpdateOperationsInput | string
    validFrom?: StringFieldUpdateOperationsInput | string
    specialisms?: StringFieldUpdateOperationsInput | string
  }

  export type InspectorCreateManyInput = {
    address: string
    workPhone: string
    mobilePhone: string
    resourceGroup: string
    grade: string
    fte: string
    chartingOfficer: string
    chartingOfficerPhone: string
    inspectorManager: string
    name: string
    proficiency: string
    validFrom: string
    specialisms: string
  }

  export type InspectorUpdateManyMutationInput = {
    address?: StringFieldUpdateOperationsInput | string
    workPhone?: StringFieldUpdateOperationsInput | string
    mobilePhone?: StringFieldUpdateOperationsInput | string
    resourceGroup?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    fte?: StringFieldUpdateOperationsInput | string
    chartingOfficer?: StringFieldUpdateOperationsInput | string
    chartingOfficerPhone?: StringFieldUpdateOperationsInput | string
    inspectorManager?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    proficiency?: StringFieldUpdateOperationsInput | string
    validFrom?: StringFieldUpdateOperationsInput | string
    specialisms?: StringFieldUpdateOperationsInput | string
  }

  export type InspectorUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    address?: StringFieldUpdateOperationsInput | string
    workPhone?: StringFieldUpdateOperationsInput | string
    mobilePhone?: StringFieldUpdateOperationsInput | string
    resourceGroup?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    fte?: StringFieldUpdateOperationsInput | string
    chartingOfficer?: StringFieldUpdateOperationsInput | string
    chartingOfficerPhone?: StringFieldUpdateOperationsInput | string
    inspectorManager?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    proficiency?: StringFieldUpdateOperationsInput | string
    validFrom?: StringFieldUpdateOperationsInput | string
    specialisms?: StringFieldUpdateOperationsInput | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type AppealCountOrderByAggregateInput = {
    id?: SortOrder
    caseReference?: SortOrder
    caseType?: SortOrder
    procedureType?: SortOrder
    band?: SortOrder
    level?: SortOrder
    siteAddress?: SortOrder
    location?: SortOrder
    localPlanningAuthority?: SortOrder
    region?: SortOrder
    caseStatus?: SortOrder
    caseAge?: SortOrder
    linkedCases?: SortOrder
    finalCommentsDate?: SortOrder
    programmingStatus?: SortOrder
    programmingNotes?: SortOrder
    jobDetails?: SortOrder
    jurisdiction?: SortOrder
    specialCircumstances?: SortOrder
    costsAppliedFor?: SortOrder
    agent?: SortOrder
    appellant?: SortOrder
    caseOfficer?: SortOrder
    lpaPhone?: SortOrder
    agentphone?: SortOrder
    appellantPhone?: SortOrder
    caseOfficerPhone?: SortOrder
    appealStartDate?: SortOrder
    validDate?: SortOrder
    eventType?: SortOrder
    eventDate?: SortOrder
    eventStatus?: SortOrder
    duration?: SortOrder
    venue?: SortOrder
  }

  export type AppealAvgOrderByAggregateInput = {
    id?: SortOrder
    band?: SortOrder
    level?: SortOrder
    caseAge?: SortOrder
  }

  export type AppealMaxOrderByAggregateInput = {
    id?: SortOrder
    caseReference?: SortOrder
    caseType?: SortOrder
    procedureType?: SortOrder
    band?: SortOrder
    level?: SortOrder
    siteAddress?: SortOrder
    location?: SortOrder
    localPlanningAuthority?: SortOrder
    region?: SortOrder
    caseStatus?: SortOrder
    caseAge?: SortOrder
    linkedCases?: SortOrder
    finalCommentsDate?: SortOrder
    programmingStatus?: SortOrder
    programmingNotes?: SortOrder
    jobDetails?: SortOrder
    jurisdiction?: SortOrder
    specialCircumstances?: SortOrder
    costsAppliedFor?: SortOrder
    agent?: SortOrder
    appellant?: SortOrder
    caseOfficer?: SortOrder
    lpaPhone?: SortOrder
    agentphone?: SortOrder
    appellantPhone?: SortOrder
    caseOfficerPhone?: SortOrder
    appealStartDate?: SortOrder
    validDate?: SortOrder
    eventType?: SortOrder
    eventDate?: SortOrder
    eventStatus?: SortOrder
    duration?: SortOrder
    venue?: SortOrder
  }

  export type AppealMinOrderByAggregateInput = {
    id?: SortOrder
    caseReference?: SortOrder
    caseType?: SortOrder
    procedureType?: SortOrder
    band?: SortOrder
    level?: SortOrder
    siteAddress?: SortOrder
    location?: SortOrder
    localPlanningAuthority?: SortOrder
    region?: SortOrder
    caseStatus?: SortOrder
    caseAge?: SortOrder
    linkedCases?: SortOrder
    finalCommentsDate?: SortOrder
    programmingStatus?: SortOrder
    programmingNotes?: SortOrder
    jobDetails?: SortOrder
    jurisdiction?: SortOrder
    specialCircumstances?: SortOrder
    costsAppliedFor?: SortOrder
    agent?: SortOrder
    appellant?: SortOrder
    caseOfficer?: SortOrder
    lpaPhone?: SortOrder
    agentphone?: SortOrder
    appellantPhone?: SortOrder
    caseOfficerPhone?: SortOrder
    appealStartDate?: SortOrder
    validDate?: SortOrder
    eventType?: SortOrder
    eventDate?: SortOrder
    eventStatus?: SortOrder
    duration?: SortOrder
    venue?: SortOrder
  }

  export type AppealSumOrderByAggregateInput = {
    id?: SortOrder
    band?: SortOrder
    level?: SortOrder
    caseAge?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type InspectorCountOrderByAggregateInput = {
    id?: SortOrder
    address?: SortOrder
    workPhone?: SortOrder
    mobilePhone?: SortOrder
    resourceGroup?: SortOrder
    grade?: SortOrder
    fte?: SortOrder
    chartingOfficer?: SortOrder
    chartingOfficerPhone?: SortOrder
    inspectorManager?: SortOrder
    name?: SortOrder
    proficiency?: SortOrder
    validFrom?: SortOrder
    specialisms?: SortOrder
  }

  export type InspectorAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type InspectorMaxOrderByAggregateInput = {
    id?: SortOrder
    address?: SortOrder
    workPhone?: SortOrder
    mobilePhone?: SortOrder
    resourceGroup?: SortOrder
    grade?: SortOrder
    fte?: SortOrder
    chartingOfficer?: SortOrder
    chartingOfficerPhone?: SortOrder
    inspectorManager?: SortOrder
    name?: SortOrder
    proficiency?: SortOrder
    validFrom?: SortOrder
    specialisms?: SortOrder
  }

  export type InspectorMinOrderByAggregateInput = {
    id?: SortOrder
    address?: SortOrder
    workPhone?: SortOrder
    mobilePhone?: SortOrder
    resourceGroup?: SortOrder
    grade?: SortOrder
    fte?: SortOrder
    chartingOfficer?: SortOrder
    chartingOfficerPhone?: SortOrder
    inspectorManager?: SortOrder
    name?: SortOrder
    proficiency?: SortOrder
    validFrom?: SortOrder
    specialisms?: SortOrder
  }

  export type InspectorSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}